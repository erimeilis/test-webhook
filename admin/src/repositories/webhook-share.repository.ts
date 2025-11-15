/**
 * Webhook Share Repository
 * Data access layer for webhook_shares table (collaboration)
 */

import type { DrizzleD1Database } from 'drizzle-orm/d1'
import { eq, and, or } from 'drizzle-orm'
import { webhookShares, webhooks } from '@/lib/db-schema'
import type { WebhookShare, NewWebhookShare } from '@/lib/db-schema'
import * as schema from '@/lib/db-schema'

export interface SharedWebhookDetails {
  shareId: string
  webhookId: string
  webhookUuid: string
  webhookName: string
  webhookTags: string | null
  role: string
  invitedAt: Date
  acceptedAt: Date | null
}

export class WebhookShareRepository {
  constructor(private db: DrizzleD1Database<typeof schema>) {}

  /**
   * Check if user has access to a webhook (by share)
   */
  async hasAccess(webhookId: string, userId: string): Promise<boolean> {
    const result = await this.db
      .select()
      .from(webhookShares)
      .where(
        and(
          eq(webhookShares.webhookId, webhookId),
          eq(webhookShares.sharedWithUserId, userId)
        )
      )
      .limit(1)

    return result.length > 0
  }

  /**
   * Check if user has access by email (for pending invites)
   */
  async hasAccessByEmail(webhookId: string, email: string): Promise<boolean> {
    const result = await this.db
      .select()
      .from(webhookShares)
      .where(
        and(
          eq(webhookShares.webhookId, webhookId),
          eq(webhookShares.sharedWithEmail, email.toLowerCase())
        )
      )
      .limit(1)

    return result.length > 0
  }

  /**
   * Find all shares for a webhook
   */
  async findByWebhookId(webhookId: string): Promise<WebhookShare[]> {
    return await this.db
      .select()
      .from(webhookShares)
      .where(eq(webhookShares.webhookId, webhookId))
      .all()
  }

  /**
   * Find all webhooks shared with a user (by email or user ID)
   */
  async findByUser(userEmail: string, userId?: string): Promise<SharedWebhookDetails[]> {
    const conditions = [eq(webhookShares.sharedWithEmail, userEmail.toLowerCase())]

    if (userId) {
      conditions.push(eq(webhookShares.sharedWithUserId, userId))
    }

    const results = await this.db
      .select({
        shareId: webhookShares.id,
        webhookId: webhooks.id,
        webhookUuid: webhooks.uuid,
        webhookName: webhooks.name,
        webhookTags: webhooks.tags,
        role: webhookShares.role,
        invitedAt: webhookShares.invitedAt,
        acceptedAt: webhookShares.acceptedAt
      })
      .from(webhookShares)
      .leftJoin(webhooks, eq(webhookShares.webhookId, webhooks.id))
      .where(or(...conditions))
      .all()

    return results.map(r => ({
      shareId: r.shareId,
      webhookId: r.webhookId || '',
      webhookUuid: r.webhookUuid || '',
      webhookName: r.webhookName || '',
      webhookTags: r.webhookTags,
      role: r.role,
      invitedAt: r.invitedAt,
      acceptedAt: r.acceptedAt
    }))
  }

  /**
   * Create a new share
   */
  async create(data: Omit<NewWebhookShare, 'id' | 'invitedAt'>): Promise<WebhookShare> {
    const id = crypto.randomUUID()
    const share: NewWebhookShare = {
      ...data,
      id,
      sharedWithEmail: data.sharedWithEmail.toLowerCase(),
      invitedAt: new Date()
    }

    await this.db.insert(webhookShares).values(share)

    const result = await this.db
      .select()
      .from(webhookShares)
      .where(eq(webhookShares.id, id))
      .limit(1)

    if (!result[0]) {
      throw new Error('Failed to create webhook share')
    }

    return result[0]
  }

  /**
   * Update share role
   */
  async updateRole(id: string, role: string): Promise<WebhookShare | null> {
    await this.db
      .update(webhookShares)
      .set({ role })
      .where(eq(webhookShares.id, id))

    const result = await this.db
      .select()
      .from(webhookShares)
      .where(eq(webhookShares.id, id))
      .limit(1)

    return result[0] ?? null
  }

  /**
   * Accept share invitation (set acceptedAt)
   */
  async acceptInvite(id: string, userId: string): Promise<WebhookShare | null> {
    await this.db
      .update(webhookShares)
      .set({
        sharedWithUserId: userId,
        acceptedAt: new Date()
      })
      .where(eq(webhookShares.id, id))

    const result = await this.db
      .select()
      .from(webhookShares)
      .where(eq(webhookShares.id, id))
      .limit(1)

    return result[0] ?? null
  }

  /**
   * Delete a share
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(webhookShares)
      .where(eq(webhookShares.id, id))

    return (result.meta.changes ?? 0) > 0
  }

  /**
   * Delete all shares for a webhook (cascade)
   */
  async deleteByWebhookId(webhookId: string): Promise<number> {
    const result = await this.db
      .delete(webhookShares)
      .where(eq(webhookShares.webhookId, webhookId))

    return result.meta.changes ?? 0
  }
}
