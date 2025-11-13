/**
 * Data Retention Cleanup Handler
 * Deletes webhook data older than 1 month
 * Runs daily (every 24 hours)
 */

import { drizzle } from 'drizzle-orm/d1'
import { lt, sql, count } from 'drizzle-orm'
import * as schema from '@/lib/db-schema'
import type { Bindings } from '@/types/hono'
import { createEmailService } from '@/lib/email'

interface UserStats {
  userId: string
  email: string
  webhookCount: number
  dataCount: number
  totalSizeBytes: number
}

/**
 * Delete webhook data older than 1 month
 * Called by scheduled cron trigger (daily)
 * Sends daily stats email to admin with all users and their webhook counts
 */
export async function cleanupOldData(env: Bindings): Promise<{
  deletedCount: number
  cutoffDate: Date
  userStats?: UserStats[]
}> {
  const db = drizzle(env.DB, { schema })

  // Calculate cutoff date: 1 month ago
  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

  console.log('🧹 Starting cleanup of data older than:', oneMonthAgo.toISOString())

  try {
    // Collect user stats BEFORE deletion
    const userStats: UserStats[] = []

    // Get all users with their webhook counts
    const users = await db.select({
      id: schema.user.id,
      email: schema.user.email,
    }).from(schema.user)

    for (const user of users) {
      // Count webhooks for this user
      const webhooks = await db.select({ count: count() })
        .from(schema.webhooks)
        .where(sql`${schema.webhooks.userId} = ${user.id}`)

      // Count webhook data and total size for this user's webhooks
      const dataStats = await db.select({
        count: count(),
        totalSize: sql<number>`COALESCE(SUM(${schema.webhookData.sizeBytes}), 0)`,
      })
        .from(schema.webhookData)
        .innerJoin(schema.webhooks, sql`${schema.webhookData.webhookId} = ${schema.webhooks.id}`)
        .where(sql`${schema.webhooks.userId} = ${user.id}`)

      userStats.push({
        userId: user.id,
        email: user.email,
        webhookCount: webhooks[0]?.count || 0,
        dataCount: dataStats[0]?.count || 0,
        totalSizeBytes: dataStats[0]?.totalSize || 0,
      })
    }

    // Delete old webhook data
    const result = await db
      .delete(schema.webhookData)
      .where(lt(schema.webhookData.receivedAt, oneMonthAgo))
      .returning()

    const deletedCount = result.length

    console.log(`🧹 Cleanup completed: deleted ${deletedCount} records older than ${oneMonthAgo.toISOString()}`)

    // Size-based cleanup: Enforce 100MB per user limit
    const MAX_USER_STORAGE_BYTES = 100 * 1024 * 1024 // 100MB
    let sizeEnforcedCount = 0

    for (const user of users) {
      // Calculate current storage for this user
      const userStorageResult = await db.select({
        totalSize: sql<number>`COALESCE(SUM(${schema.webhookData.sizeBytes}), 0)`,
      })
        .from(schema.webhookData)
        .innerJoin(schema.webhooks, sql`${schema.webhookData.webhookId} = ${schema.webhooks.id}`)
        .where(sql`${schema.webhooks.userId} = ${user.id}`)

      const currentStorage = userStorageResult[0]?.totalSize || 0

      if (currentStorage > MAX_USER_STORAGE_BYTES) {
        console.log(`🗑️ User ${user.email} exceeds 100MB (${(currentStorage / 1024 / 1024).toFixed(2)} MB), cleaning up oldest requests...`)

        // Get total count to calculate average request size
        const userCountResult = await db
          .select({
            count: count(),
          })
          .from(schema.webhookData)
          .innerJoin(schema.webhooks, sql`${schema.webhookData.webhookId} = ${schema.webhooks.id}`)
          .where(sql`${schema.webhooks.userId} = ${user.id}`)

        const totalCount = userCountResult[0]?.count || 0
        if (totalCount === 0) continue

        // Calculate average request size
        const avgRequestSize = currentStorage / totalCount
        const excessStorage = currentStorage - MAX_USER_STORAGE_BYTES
        const approxRecordsToDelete = Math.ceil(excessStorage / avgRequestSize)

        console.log(`   Average request size: ${(avgRequestSize / 1024).toFixed(2)} KB`)
        console.log(`   Approximate records to delete: ${approxRecordsToDelete}`)

        let remainingStorage = currentStorage
        let batchDeletedCount = 0

        // Step 1: Bulk delete approximate amount in ONE statement
        if (approxRecordsToDelete > 0) {
          const bulkDeleted = await env.DB.prepare(`
            DELETE FROM webhook_data
            WHERE id IN (
              SELECT wd.id
              FROM webhook_data wd
              INNER JOIN webhooks w ON wd.webhook_id = w.id
              WHERE w.user_id = ?
              ORDER BY wd.received_at ASC
              LIMIT ?
            )
            RETURNING size_bytes
          `).bind(user.id, approxRecordsToDelete).all()

          if (bulkDeleted.results && bulkDeleted.results.length > 0) {
            const deletedSize = bulkDeleted.results.reduce((sum: number, r: any) => sum + r.size_bytes, 0)
            remainingStorage -= deletedSize
            batchDeletedCount += bulkDeleted.results.length

            console.log(`   Bulk deleted ${bulkDeleted.results.length} requests, storage now: ${(remainingStorage / 1024 / 1024).toFixed(2)} MB`)
          }
        }

        // Step 2: Fine-tune with smaller 100-record batches if still over limit
        while (remainingStorage > MAX_USER_STORAGE_BYTES) {
          const fineTuneDeleted = await env.DB.prepare(`
            DELETE FROM webhook_data
            WHERE id IN (
              SELECT wd.id
              FROM webhook_data wd
              INNER JOIN webhooks w ON wd.webhook_id = w.id
              WHERE w.user_id = ?
              ORDER BY wd.received_at ASC
              LIMIT 100
            )
            RETURNING size_bytes
          `).bind(user.id).all()

          if (!fineTuneDeleted.results || fineTuneDeleted.results.length === 0) break

          const deletedSize = fineTuneDeleted.results.reduce((sum: number, r: any) => sum + r.size_bytes, 0)
          remainingStorage -= deletedSize
          batchDeletedCount += fineTuneDeleted.results.length

          console.log(`   Fine-tuned: deleted ${fineTuneDeleted.results.length} requests, storage now: ${(remainingStorage / 1024 / 1024).toFixed(2)} MB`)

          // Safety break to prevent infinite loops
          if (batchDeletedCount > 200000) {
            console.warn(`   ⚠️ Hit safety limit (200k deletions) for user ${user.email}`)
            break
          }
        }

        sizeEnforcedCount += batchDeletedCount
        console.log(`✅ User ${user.email} cleanup complete: deleted ${batchDeletedCount} requests`)
      }
    }

    if (sizeEnforcedCount > 0) {
      console.log(`📦 Size enforcement completed: deleted ${sizeEnforcedCount} additional records to enforce 100MB limit`)
    }

    // Send daily stats email to admin (ALWAYS, not just when data deleted)
    if (env.ADMIN_EMAIL) {
      try {
        const emailService = createEmailService(env.RESEND_API_KEY, env.FROM_EMAIL)
        // Format file size
        const formatBytes = (bytes: number): string => {
          if (bytes === 0) return '0 B'
          const k = 1024
          const sizes = ['B', 'KB', 'MB', 'GB']
          const i = Math.floor(Math.log(bytes) / Math.log(k))
          return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
        }

        // Calculate totals
        const totalUsers = userStats.length
        const totalWebhooks = userStats.reduce((sum, u) => sum + u.webhookCount, 0)
        const totalData = userStats.reduce((sum, u) => sum + u.dataCount, 0)
        const totalSize = userStats.reduce((sum, u) => sum + u.totalSizeBytes, 0)

        // Generate user rows HTML
        const userRowsHtml = userStats
          .sort((a, b) => b.dataCount - a.dataCount) // Sort by data count descending
          .map(user => `
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">${user.email}</td>
              <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: center;">${user.webhookCount}</td>
              <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: center;">${user.dataCount}</td>
              <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right;">${formatBytes(user.totalSizeBytes)}</td>
            </tr>
          `).join('')

        const totalDeleted = deletedCount + sizeEnforcedCount
        await emailService.sendEmail({
          to: env.ADMIN_EMAIL,
          subject: `📊 Daily Webhook Stats | ${totalUsers} users | ${totalData} records | ${totalDeleted} deleted`,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; padding: 20px; }
                  .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
                  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
                  .header h1 { color: white; margin: 0; font-size: 24px; }
                  .content { padding: 30px; }
                  .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin: 20px 0; }
                  .stat { background: #f8f9fa; padding: 15px; border-radius: 6px; }
                  .stat-label { color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
                  .stat-value { color: #333; font-size: 24px; font-weight: bold; margin-top: 5px; }
                  .table-container { overflow-x: auto; margin: 20px 0; }
                  table { width: 100%; border-collapse: collapse; }
                  th { background: #f8f9fa; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e0e0e0; }
                  .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background: #f8f9fa; }
                  .section-title { font-size: 18px; font-weight: 600; margin-top: 30px; margin-bottom: 15px; color: #333; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>📊 Daily Webhook System Report</h1>
                  </div>
                  <div class="content">
                    <h2 class="section-title">System Overview</h2>
                    <div class="stat-grid">
                      <div class="stat">
                        <div class="stat-label">Total Users</div>
                        <div class="stat-value">${totalUsers}</div>
                      </div>
                      <div class="stat">
                        <div class="stat-label">Total Webhooks</div>
                        <div class="stat-value">${totalWebhooks}</div>
                      </div>
                      <div class="stat">
                        <div class="stat-label">Total Records</div>
                        <div class="stat-value">${totalData}</div>
                      </div>
                      <div class="stat">
                        <div class="stat-label">Total Storage</div>
                        <div class="stat-value">${formatBytes(totalSize)}</div>
                      </div>
                    </div>

                    ${deletedCount > 0 || sizeEnforcedCount > 0 ? `
                    <div style="margin: 20px 0; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                      ${deletedCount > 0 ? `<div><strong>🧹 Time-based Cleanup:</strong> Deleted ${deletedCount} records older than ${oneMonthAgo.toISOString().split('T')[0]}</div>` : ''}
                      ${sizeEnforcedCount > 0 ? `<div style="margin-top: ${deletedCount > 0 ? '8px' : '0'}"><strong>📦 Size-based Cleanup:</strong> Deleted ${sizeEnforcedCount} records to enforce 100MB per-user limit</div>` : ''}
                      ${deletedCount + sizeEnforcedCount > 0 ? `<div style="margin-top: 8px; font-weight: bold;">Total Deleted: ${deletedCount + sizeEnforcedCount} records</div>` : ''}
                    </div>
                    ` : ''}

                    <h2 class="section-title">User Statistics</h2>
                    <div class="table-container">
                      <table>
                        <thead>
                          <tr>
                            <th>User Email</th>
                            <th style="text-align: center;">Webhooks</th>
                            <th style="text-align: center;">Records</th>
                            <th style="text-align: right;">Storage</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${userRowsHtml}
                        </tbody>
                      </table>
                    </div>

                    <div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-left: 4px solid #2196f3; border-radius: 4px;">
                      <strong>ℹ️ Report Time:</strong> ${new Date().toISOString().replace('T', ' ').split('.')[0]} UTC
                    </div>
                  </div>
                  <div class="footer">
                    <p>This is an automated daily report from your Webhook System.</p>
                    <p>Data older than 1 month is automatically cleaned up. Users exceeding 100MB storage have their oldest requests removed.</p>
                  </div>
                </div>
              </body>
            </html>
          `,
        })
        console.log(`📧 Daily stats email sent to ${env.ADMIN_EMAIL}`)
      } catch (emailError) {
        console.error('📧 Failed to send daily stats email:', emailError)
        // Don't throw - email failure shouldn't break cleanup
      }
    } else {
      console.warn('⚠️ ADMIN_EMAIL not configured - skipping daily stats email')
    }

    return {
      deletedCount,
      cutoffDate: oneMonthAgo,
      userStats,
    }
  } catch (error) {
    console.error('🚨 Cleanup error:', error)
    throw error
  }
}
