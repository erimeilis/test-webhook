/**
 * Webhook Share Service
 * Business logic layer for webhook sharing/collaboration
 */

import type { Repositories } from '@/repositories'
import type { WebhookShare, NewWebhookShare } from '@/lib/db-schema'
import type { SharedWebhookDetails } from '@/repositories/webhook-share.repository'
import { validate, shareWebhookSchema } from '@/lib/validation'
import { NotFoundError, UnauthorizedError, ValidationError } from '@/lib/errors'

export class WebhookShareService {
  constructor(private repos: Repositories) {}

  /**
   * Share webhook with another user (create invite)
   * Only webhook owner can share
   */
  async shareWebhook(
    webhookId: string,
    ownerId: string,
    data: unknown
  ): Promise<WebhookShare> {
    // Validate input
    const validated = validate(shareWebhookSchema, data)

    // Verify ownership
    const webhook = await this.repos.webhooks.findByIdAndUser(webhookId, ownerId)
    if (!webhook) {
      throw new NotFoundError('Webhook not found or you are not the owner')
    }

    // Check if already shared with this email
    const existingShare = await this.repos.webhookShares.hasAccessByEmail(
      webhookId,
      validated.email
    )
    if (existingShare) {
      throw new ValidationError('Webhook already shared with this user')
    }

    // Prevent sharing with self
    const owner = await this.repos.users.findById(ownerId)
    if (owner && owner.email.toLowerCase() === validated.email.toLowerCase()) {
      throw new ValidationError('Cannot share webhook with yourself')
    }

    // Create share
    const shareData: Omit<NewWebhookShare, 'id' | 'invitedAt'> = {
      webhookId,
      sharedWithEmail: validated.email,
      invitedByUserId: ownerId,
      role: validated.role || 'viewer'
    }

    return await this.repos.webhookShares.create(shareData)
  }

  /**
   * Accept webhook share invitation
   */
  async acceptInvite(shareId: string, userId: string, userEmail: string): Promise<WebhookShare> {
    // Find share by email (pending invites)
    const shares = await this.repos.webhookShares.findByUser(userEmail, userId)
    const share = shares.find(s => s.shareId === shareId)

    if (!share) {
      throw new NotFoundError('Share invitation not found')
    }

    // Accept invitation
    const accepted = await this.repos.webhookShares.acceptInvite(shareId, userId)
    if (!accepted) {
      throw new Error('Failed to accept invitation')
    }

    return accepted
  }

  /**
   * Update share role
   * Only webhook owner can update roles
   */
  async updateShareRole(
    shareId: string,
    webhookId: string,
    ownerId: string,
    newRole: string
  ): Promise<WebhookShare> {
    // Verify ownership
    const webhook = await this.repos.webhooks.findByIdAndUser(webhookId, ownerId)
    if (!webhook) {
      throw new UnauthorizedError('Only webhook owner can update share roles')
    }

    // Validate role
    if (!['viewer', 'editor'].includes(newRole)) {
      throw new ValidationError('Invalid role. Must be "viewer" or "editor"')
    }

    // Update role
    const updated = await this.repos.webhookShares.updateRole(shareId, newRole)
    if (!updated) {
      throw new NotFoundError('Share not found')
    }

    return updated
  }

  /**
   * Remove share (revoke access)
   * Only webhook owner can remove shares
   */
  async removeShare(shareId: string, webhookId: string, ownerId: string): Promise<void> {
    // Verify ownership
    const webhook = await this.repos.webhooks.findByIdAndUser(webhookId, ownerId)
    if (!webhook) {
      throw new UnauthorizedError('Only webhook owner can remove shares')
    }

    // Delete share
    const deleted = await this.repos.webhookShares.delete(shareId)
    if (!deleted) {
      throw new NotFoundError('Share not found')
    }
  }

  /**
   * Get all shares for a webhook
   * Only webhook owner can view shares
   */
  async getWebhookShares(webhookId: string, ownerId: string): Promise<WebhookShare[]> {
    // Verify ownership
    const webhook = await this.repos.webhooks.findByIdAndUser(webhookId, ownerId)
    if (!webhook) {
      throw new UnauthorizedError('Only webhook owner can view shares')
    }

    return await this.repos.webhookShares.findByWebhookId(webhookId)
  }

  /**
   * Get all webhooks shared with a user
   */
  async getSharedWebhooks(userEmail: string, userId: string): Promise<SharedWebhookDetails[]> {
    return await this.repos.webhookShares.findByUser(userEmail, userId)
  }
}
