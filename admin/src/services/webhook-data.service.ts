/**
 * Webhook Data Service
 * Business logic layer for webhook request data
 */

import type { Repositories } from '@/repositories'
import type { WebhookData } from '@/lib/db-schema'
import type { WebhookDataFilters, PaginatedResult } from '@/repositories/webhook-data.repository'
import { NotFoundError, UnauthorizedError } from '@/lib/errors'

export class WebhookDataService {
  constructor(private repos: Repositories) {}

  /**
   * Get webhook data with access verification and filtering
   */
  async getWebhookData(
    webhookId: string,
    userId: string,
    filters: WebhookDataFilters = {}
  ): Promise<PaginatedResult<WebhookData>> {
    // Verify access (ownership or shared)
    await this.verifyWebhookAccess(webhookId, userId)

    // Get data with filters
    return await this.repos.webhookData.findByWebhookId(webhookId, filters)
  }

  /**
   * Get recent webhook data (no pagination, limited results)
   */
  async getRecentWebhookData(
    webhookId: string,
    userId: string,
    limit: number = 50
  ): Promise<WebhookData[]> {
    // Verify access
    await this.verifyWebhookAccess(webhookId, userId)

    // Get recent data
    return await this.repos.webhookData.findRecentByWebhookId(webhookId, limit)
  }

  /**
   * Get webhook stats (size, method counts)
   */
  async getWebhookStats(webhookId: string, userId: string): Promise<{
    totalSize: number
    methodCounts: { GET: number; POST: number }
  }> {
    // Verify access
    await this.verifyWebhookAccess(webhookId, userId)

    // Get stats
    const [totalSize, methodCounts] = await Promise.all([
      this.repos.webhookData.getTotalSizeByWebhookId(webhookId),
      this.repos.webhookData.getMethodCountsByWebhookId(webhookId)
    ])

    return {
      totalSize,
      methodCounts
    }
  }

  /**
   * Delete all data for a webhook (cascade delete)
   * Only webhook owner can perform this operation
   */
  async deleteWebhookData(webhookId: string, userId: string): Promise<number> {
    // Verify ownership (not just shared access)
    const webhook = await this.repos.webhooks.findByIdAndUser(webhookId, userId)
    if (!webhook) {
      throw new UnauthorizedError('Only webhook owner can delete all data')
    }

    // Delete all data
    return await this.repos.webhookData.deleteByWebhookId(webhookId)
  }

  /**
   * Verify webhook access (ownership or shared)
   * Throws error if no access
   */
  private async verifyWebhookAccess(webhookId: string, userId: string): Promise<void> {
    // Check ownership
    const owned = await this.repos.webhooks.findByIdAndUser(webhookId, userId)
    if (owned) return

    // Check shared access
    const hasSharedAccess = await this.repos.webhookShares.hasAccess(webhookId, userId)
    if (hasSharedAccess) return

    throw new NotFoundError('Webhook not found or access denied')
  }
}
