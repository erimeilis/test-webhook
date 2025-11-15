/**
 * Webhook Service
 * Business logic layer for webhook operations
 */

import type { Repositories } from '@/repositories'
import type { Webhook, NewWebhook } from '@/lib/db-schema'
import { validate, createWebhookSchema, updateWebhookSchema } from '@/lib/validation'
import { NotFoundError } from '@/lib/errors'

export class WebhookService {
  constructor(private repos: Repositories) {}

  /**
   * Create a new webhook with validation
   */
  async createWebhook(userId: string, data: unknown): Promise<Webhook> {
    // Validate input
    const validated = validate(createWebhookSchema, data)

    // Generate unique UUID for webhook URL
    const uuid = crypto.randomUUID()

    // Create webhook
    const webhookData: Omit<NewWebhook, 'id' | 'createdAt'> = {
      userId,
      uuid,
      name: validated.name,
      tags: validated.tags ? JSON.stringify(validated.tags) : null
    }

    return await this.repos.webhooks.create(webhookData)
  }

  /**
   * Update webhook with ownership verification
   */
  async updateWebhook(
    webhookId: string,
    userId: string,
    data: unknown
  ): Promise<Webhook> {
    // Validate input
    const validated = validate(updateWebhookSchema, data)

    // Verify ownership
    const existing = await this.repos.webhooks.findByIdAndUser(webhookId, userId)
    if (!existing) {
      throw new NotFoundError('Webhook not found or access denied')
    }

    // Update webhook
    const updateData: Partial<NewWebhook> = {}
    if (validated.name !== undefined) updateData.name = validated.name
    if (validated.tags !== undefined) {
      updateData.tags = validated.tags ? JSON.stringify(validated.tags) : null
    }

    const updated = await this.repos.webhooks.update(webhookId, updateData)
    if (!updated) {
      throw new NotFoundError('Webhook not found after update')
    }

    return updated
  }

  /**
   * Delete webhook with cascade (shares and data)
   */
  async deleteWebhook(webhookId: string, userId: string): Promise<void> {
    // Verify ownership
    const existing = await this.repos.webhooks.findByIdAndUser(webhookId, userId)
    if (!existing) {
      throw new NotFoundError('Webhook not found or access denied')
    }

    // Delete associated shares
    await this.repos.webhookShares.deleteByWebhookId(webhookId)

    // Delete associated data
    await this.repos.webhookData.deleteByWebhookId(webhookId)

    // Delete webhook
    const deleted = await this.repos.webhooks.delete(webhookId)
    if (!deleted) {
      throw new Error('Failed to delete webhook')
    }
  }

  /**
   * Get webhook by ID with access verification
   * Checks both ownership and shared access
   */
  async getWebhook(webhookId: string, userId: string): Promise<Webhook> {
    // Check ownership first
    let webhook = await this.repos.webhooks.findByIdAndUser(webhookId, userId)

    // If not owner, check shared access
    if (!webhook) {
      const hasSharedAccess = await this.repos.webhookShares.hasAccess(webhookId, userId)
      if (hasSharedAccess) {
        webhook = await this.repos.webhooks.findById(webhookId)
      }
    }

    if (!webhook) {
      throw new NotFoundError('Webhook not found or access denied')
    }

    return webhook
  }

  /**
   * Get webhook by UUID (public access for ingestion)
   */
  async getWebhookByUuid(uuid: string): Promise<Webhook> {
    const webhook = await this.repos.webhooks.findByUuid(uuid)
    if (!webhook) {
      throw new NotFoundError('Webhook not found')
    }
    return webhook
  }

  /**
   * Get all webhooks for a user (owned + shared)
   */
  async getUserWebhooks(userId: string, userEmail: string): Promise<{
    owned: Webhook[]
    shared: Array<{
      webhook: Webhook
      role: string
      invitedAt: Date
      acceptedAt: Date | null
    }>
  }> {
    // Get owned webhooks
    const owned = await this.repos.webhooks.findByUser(userId)

    // Get shared webhooks
    const sharedDetails = await this.repos.webhookShares.findByUser(userEmail, userId)

    // Fetch full webhook data for shared webhooks
    const shared = await Promise.all(
      sharedDetails.map(async (share) => {
        const webhook = await this.repos.webhooks.findById(share.webhookId)
        if (!webhook) {
          throw new NotFoundError(`Shared webhook ${share.webhookId} not found`)
        }
        return {
          webhook,
          role: share.role,
          invitedAt: share.invitedAt,
          acceptedAt: share.acceptedAt
        }
      })
    )

    return { owned, shared }
  }

  /**
   * Count webhooks for a user
   */
  async countUserWebhooks(userId: string): Promise<number> {
    return await this.repos.webhooks.countByUser(userId)
  }

  /**
   * Verify webhook access (ownership or shared)
   */
  async verifyAccess(webhookId: string, userId: string): Promise<boolean> {
    // Check ownership
    const owned = await this.repos.webhooks.findByIdAndUser(webhookId, userId)
    if (owned) return true

    // Check shared access
    return await this.repos.webhookShares.hasAccess(webhookId, userId)
  }
}
