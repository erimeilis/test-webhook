/**
 * Webhook API Handlers
 * CRUD operations for webhooks
 */

import type { Context } from 'hono'
import type { Bindings, Variables } from '@/types/hono'
import { drizzle } from 'drizzle-orm/d1'
import { webhooks, webhookData } from '@/lib/db-schema'
import { eq, and, desc } from 'drizzle-orm'

type AppContext = Context<{ Bindings: Bindings; Variables: Variables }>

// List webhooks for current user
export async function listWebhooks(c: AppContext) {
  const user = c.get('user')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const db = drizzle(c.env.DB)

    const userWebhooks = await db
      .select()
      .from(webhooks)
      .where(eq(webhooks.userId, user.id))
      .orderBy(webhooks.createdAt)
      .all()

    return c.json({ webhooks: userWebhooks })
  } catch (error) {
    console.error('Error listing webhooks:', error)
    return c.json({ error: 'Failed to list webhooks' }, 500)
  }
}

// Create new webhook
export async function createWebhook(c: AppContext) {
  const user = c.get('user')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const body = await c.req.json()
    const { name, tags } = body

    if (!name || name.trim().length === 0) {
      return c.json({ error: 'Name is required' }, 400)
    }

    const db = drizzle(c.env.DB)

    // Generate webhook ID and UUID
    const webhookId = crypto.randomUUID()
    const webhookUuid = crypto.randomUUID()
    const now = new Date()

    await db.insert(webhooks).values({
      id: webhookId,
      userId: user.id,
      uuid: webhookUuid,
      name: name.trim(),
      tags: tags || null,
      createdAt: now,
    })

    // Fetch the created webhook
    const created = await db
      .select()
      .from(webhooks)
      .where(eq(webhooks.id, webhookId))
      .get()

    return c.json({ webhook: created }, 201)
  } catch (error) {
    console.error('Error creating webhook:', error)
    return c.json({ error: 'Failed to create webhook' }, 500)
  }
}

// Delete webhook
export async function deleteWebhook(c: AppContext) {
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

    // Verify webhook belongs to user before deleting
    const webhook = await db
      .select()
      .from(webhooks)
      .where(and(eq(webhooks.id, webhookId), eq(webhooks.userId, user.id)))
      .get()

    if (!webhook) {
      return c.json({ error: 'Webhook not found' }, 404)
    }

    await db.delete(webhooks).where(eq(webhooks.id, webhookId))

    return c.json({ success: true, message: 'Webhook deleted' })
  } catch (error) {
    console.error('Error deleting webhook:', error)
    return c.json({ error: 'Failed to delete webhook' }, 500)
  }
}

// Get webhook requests/data
export async function getWebhookData(c: AppContext) {
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

    // Verify webhook belongs to user
    const webhook = await db
      .select()
      .from(webhooks)
      .where(and(eq(webhooks.id, webhookId), eq(webhooks.userId, user.id)))
      .get()

    if (!webhook) {
      return c.json({ error: 'Webhook not found' }, 404)
    }

    // Fetch webhook data (recent 50 requests)
    const requests = await db
      .select()
      .from(webhookData)
      .where(eq(webhookData.webhookId, webhookId))
      .orderBy(desc(webhookData.receivedAt))
      .limit(50)
      .all()

    return c.json({ requests })
  } catch (error) {
    console.error('Error fetching webhook data:', error)
    return c.json({ error: 'Failed to fetch webhook data' }, 500)
  }
}

// Update webhook (name and tags)
export async function updateWebhook(c: AppContext) {
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
    const { name, tags } = body

    if (!name || name.trim().length === 0) {
      return c.json({ error: 'Name is required' }, 400)
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

    // Update webhook
    await db
      .update(webhooks)
      .set({
        name: name.trim(),
        tags: tags || null,
      })
      .where(eq(webhooks.id, webhookId))

    // Fetch updated webhook
    const updated = await db
      .select()
      .from(webhooks)
      .where(eq(webhooks.id, webhookId))
      .get()

    return c.json({ webhook: updated })
  } catch (error) {
    console.error('Error updating webhook:', error)
    return c.json({ error: 'Failed to update webhook' }, 500)
  }
}
