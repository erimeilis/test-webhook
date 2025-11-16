/**
 * Admin API Handlers
 * Admin-only endpoints for user management and statistics
 */

import type { Context } from 'hono'
import type { Bindings, Variables } from '@/types/hono'
import { drizzle } from 'drizzle-orm/d1'
import { user, webhooks, webhookData } from '@/lib/db-schema'
import { eq, sql, desc } from 'drizzle-orm'

type AppContext = Context<{ Bindings: Bindings; Variables: Variables }>

// Get all users with statistics
export async function listUsers(c: AppContext) {
  const isAdmin = c.get('isAdmin')

  if (!isAdmin) {
    return c.json({ error: 'Unauthorized' }, 403)
  }

  try {
    const db = drizzle(c.env.DB)

    // Get all users with webhook counts and total bytes
    const users = await db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      })
      .from(user)
      .orderBy(desc(user.createdAt))
      .all()

    // Get webhook counts for each user
    const webhookCounts = await db
      .select({
        userId: webhooks.userId,
        count: sql<number>`count(*)`.as('count'),
      })
      .from(webhooks)
      .groupBy(webhooks.userId)
      .all()

    // Get request counts and total bytes for each user
    const requestStats = await db
      .select({
        userId: webhooks.userId,
        requestCount: sql<number>`count(${webhookData.id})`.as('requestCount'),
        totalBytes: sql<number>`sum(${webhookData.sizeBytes})`.as('totalBytes'),
      })
      .from(webhooks)
      .leftJoin(webhookData, eq(webhooks.id, webhookData.webhookId))
      .groupBy(webhooks.userId)
      .all()

    // Combine all stats
    const usersWithStats = users.map(u => {
      const webhookCount = webhookCounts.find(wc => wc.userId === u.id)?.count || 0
      const stats = requestStats.find(rs => rs.userId === u.id)

      return {
        ...u,
        webhookCount,
        requestCount: stats?.requestCount || 0,
        totalBytes: stats?.totalBytes || 0,
      }
    })

    return c.json({ users: usersWithStats })
  } catch (error) {
    console.error('Error listing users:', error)
    return c.json({ error: 'Failed to list users' }, 500)
  }
}

// Impersonate a user (Better Auth admin plugin handles this)
export async function impersonateUser(c: AppContext) {
  const isAdmin = c.get('isAdmin')

  if (!isAdmin) {
    return c.json({ error: 'Unauthorized' }, 403)
  }

  try {
    const { userId } = await c.req.json()

    if (!userId) {
      return c.json({ error: 'User ID is required' }, 400)
    }

    // Better Auth admin plugin provides impersonation via /api/auth/admin/impersonate
    // This endpoint just validates the admin status
    return c.json({ success: true, userId })
  } catch (error) {
    console.error('Error impersonating user:', error)
    return c.json({ error: 'Failed to impersonate user' }, 500)
  }
}

// Stop impersonation (Better Auth admin plugin handles this)
export async function stopImpersonation(c: AppContext) {
  const isAdmin = c.get('isAdmin')

  if (!isAdmin) {
    return c.json({ error: 'Unauthorized' }, 403)
  }

  // Better Auth admin plugin provides stop impersonation via /api/auth/admin/stop-impersonation
  return c.json({ success: true })
}
