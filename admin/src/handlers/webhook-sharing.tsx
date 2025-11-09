/**
 * Webhook Sharing Handlers
 * Collaboration and access management
 */

import type { Context } from 'hono'
import type { Bindings, Variables } from '@/types/hono'
import { drizzle } from 'drizzle-orm/d1'
import { webhooks, webhookShares, users } from '@/lib/db-schema'
import { eq, and, or } from 'drizzle-orm'

type AppContext = Context<{ Bindings: Bindings; Variables: Variables }>

// Share webhook with user by email
export async function shareWebhook(c: AppContext) {
  const user = c.get('user')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const webhookId = c.req.param('id')

    if (!webhookId) {
      return c.json({ error: 'Webhook ID is required' }, 400)
    }

    const body = await c.req.json()
    const { email, role = 'collaborator' } = body

    if (!email || email.trim().length === 0) {
      return c.json({ error: 'Email is required' }, 400)
    }

    if (role !== 'owner' && role !== 'collaborator') {
      return c.json({ error: 'Role must be either "owner" or "collaborator"' }, 400)
    }

    const db = drizzle(c.env.DB)

    // Verify webhook belongs to user
    const webhook = await db
      .select()
      .from(webhooks)
      .where(and(eq(webhooks.id, webhookId), eq(webhooks.userId, user.id)))
      .get()

    if (!webhook) {
      return c.json({ error: 'Webhook not found' }, 404)
    }

    // Check if user exists
    const invitedUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email.trim().toLowerCase()))
      .get()

    // Check if already shared
    const existingShare = await db
      .select()
      .from(webhookShares)
      .where(
        and(
          eq(webhookShares.webhookId, webhookId),
          eq(webhookShares.sharedWithEmail, email.trim().toLowerCase())
        )
      )
      .get()

    if (existingShare) {
      return c.json({ error: 'Webhook already shared with this user' }, 400)
    }

    // Create share
    const shareId = crypto.randomUUID()
    const now = new Date()

    await db.insert(webhookShares).values({
      id: shareId,
      webhookId,
      sharedWithEmail: email.trim().toLowerCase(),
      sharedWithUserId: invitedUser?.id || null,
      invitedByUserId: user.id,
      role,
      invitedAt: now,
      acceptedAt: invitedUser ? now : null, // Auto-accept if user exists
    })

    // Fetch created share
    const share = await db
      .select()
      .from(webhookShares)
      .where(eq(webhookShares.id, shareId))
      .get()

    return c.json({ share }, 201)
  } catch (error) {
    console.error('Error sharing webhook:', error)
    return c.json({ error: 'Failed to share webhook' }, 500)
  }
}

// List all collaborators for a webhook
export async function listCollaborators(c: AppContext) {
  const user = c.get('user')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const webhookId = c.req.param('id')

    if (!webhookId) {
      return c.json({ error: 'Webhook ID is required' }, 400)
    }

    const db = drizzle(c.env.DB)

    // Verify user has access to webhook (owner or collaborator)
    const webhook = await db
      .select()
      .from(webhooks)
      .where(eq(webhooks.id, webhookId))
      .get()

    if (!webhook) {
      return c.json({ error: 'Webhook not found' }, 404)
    }

    // Check if user is owner or has shared access
    const hasAccess =
      webhook.userId === user.id ||
      (await db
        .select()
        .from(webhookShares)
        .where(
          and(
            eq(webhookShares.webhookId, webhookId),
            or(
              eq(webhookShares.sharedWithUserId, user.id),
              eq(webhookShares.sharedWithEmail, user.email.toLowerCase())
            )
          )
        )
        .get())

    if (!hasAccess) {
      return c.json({ error: 'Access denied' }, 403)
    }

    // Fetch all collaborators
    const collaborators = await db
      .select()
      .from(webhookShares)
      .where(eq(webhookShares.webhookId, webhookId))
      .all()

    return c.json({ collaborators })
  } catch (error) {
    console.error('Error listing collaborators:', error)
    return c.json({ error: 'Failed to list collaborators' }, 500)
  }
}

// Remove collaborator from webhook
export async function removeCollaborator(c: AppContext) {
  const user = c.get('user')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const webhookId = c.req.param('id')
    const shareId = c.req.param('shareId')

    if (!webhookId) {
      return c.json({ error: 'Webhook ID is required' }, 400)
    }

    if (!shareId) {
      return c.json({ error: 'Share ID is required' }, 400)
    }

    const db = drizzle(c.env.DB)

    // Verify webhook belongs to user (only owner can remove collaborators)
    const webhook = await db
      .select()
      .from(webhooks)
      .where(and(eq(webhooks.id, webhookId), eq(webhooks.userId, user.id)))
      .get()

    if (!webhook) {
      return c.json({ error: 'Webhook not found or access denied' }, 404)
    }

    // Find and delete the share by share ID
    const share = await db
      .select()
      .from(webhookShares)
      .where(
        and(
          eq(webhookShares.webhookId, webhookId),
          eq(webhookShares.id, shareId)
        )
      )
      .get()

    if (!share) {
      return c.json({ error: 'Share not found' }, 404)
    }

    await db.delete(webhookShares).where(eq(webhookShares.id, share.id))

    return c.json({ success: true, message: 'Collaborator removed' })
  } catch (error) {
    console.error('Error removing collaborator:', error)
    return c.json({ error: 'Failed to remove collaborator' }, 500)
  }
}
