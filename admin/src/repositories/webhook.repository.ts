/**
 * Webhook Repository
 * Data access layer for webhooks table
 */

import type { DrizzleD1Database } from 'drizzle-orm/d1'
import { eq, and } from 'drizzle-orm'
import { webhooks } from '@/lib/db-schema'
import type { Webhook, NewWebhook } from '@/lib/db-schema'
import * as schema from '@/lib/db-schema'

export class WebhookRepository {
  constructor(private db: DrizzleD1Database<typeof schema>) {}

  /**
   * Find webhook by ID
   */
  async findById(id: string): Promise<Webhook | null> {
    const result = await this.db
      .select()
      .from(webhooks)
      .where(eq(webhooks.id, id))
      .limit(1)

    return result[0] ?? null
  }

  /**
   * Find webhook by UUID
   */
  async findByUuid(uuid: string): Promise<Webhook | null> {
    const result = await this.db
      .select()
      .from(webhooks)
      .where(eq(webhooks.uuid, uuid))
      .limit(1)

    return result[0] ?? null
  }

  /**
   * Find all webhooks for a user
   */
  async findByUser(userId: string): Promise<Webhook[]> {
    return await this.db
      .select()
      .from(webhooks)
      .where(eq(webhooks.userId, userId))
      .orderBy(webhooks.createdAt)
      .all()
  }

  /**
   * Find webhook by ID and verify ownership
   */
  async findByIdAndUser(id: string, userId: string): Promise<Webhook | null> {
    const result = await this.db
      .select()
      .from(webhooks)
      .where(and(eq(webhooks.id, id), eq(webhooks.userId, userId)))
      .limit(1)

    return result[0] ?? null
  }

  /**
   * Create a new webhook
   */
  async create(data: Omit<NewWebhook, 'id' | 'createdAt'>): Promise<Webhook> {
    const id = crypto.randomUUID()
    const webhook: NewWebhook = {
      ...data,
      id,
      createdAt: new Date()
    }

    await this.db.insert(webhooks).values(webhook)

    // Return the created webhook
    const result = await this.db
      .select()
      .from(webhooks)
      .where(eq(webhooks.id, id))
      .limit(1)

    if (!result[0]) {
      throw new Error('Failed to create webhook')
    }

    return result[0]
  }

  /**
   * Update webhook
   */
  async update(id: string, data: Partial<NewWebhook>): Promise<Webhook | null> {
    await this.db
      .update(webhooks)
      .set(data)
      .where(eq(webhooks.id, id))

    return await this.findById(id)
  }

  /**
   * Delete webhook
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(webhooks)
      .where(eq(webhooks.id, id))

    return (result.meta.changes ?? 0) > 0
  }

  /**
   * Count webhooks for a user
   */
  async countByUser(userId: string): Promise<number> {
    const webhookList = await this.findByUser(userId)
    return webhookList.length
  }
}
