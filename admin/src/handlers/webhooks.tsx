/**
 * Webhook API Handlers (Refactored)
 * CRUD operations for webhooks using service layer
 */

import type { Context } from 'hono'
import type { Bindings, Variables } from '@/types/hono'
import { NotFoundError, UnauthorizedError, ValidationError } from '@/lib/errors'

type AppContext = Context<{ Bindings: Bindings; Variables: Variables }>

/**
 * List webhooks for current user
 * GET /api/webhooks
 */
export async function listWebhooks(c: AppContext) {
  const user = c.get('user')
  const services = c.get('services')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const { owned, shared } = await services.webhooks.getUserWebhooks(user.id, user.email)

    return c.json({
      webhooks: owned,
      shared: shared.map(s => ({
        ...s.webhook,
        role: s.role,
        invitedAt: s.invitedAt,
        acceptedAt: s.acceptedAt
      }))
    })
  } catch (error) {
    console.error('Error listing webhooks:', error)
    return c.json({ error: 'Failed to list webhooks' }, 500)
  }
}

/**
 * Create new webhook
 * POST /api/webhooks
 */
export async function createWebhook(c: AppContext) {
  const user = c.get('user')
  const services = c.get('services')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const body = await c.req.json()
    const webhook = await services.webhooks.createWebhook(user.id, body)

    // Cache webhook UUID → ID mapping in KV (1 hour TTL)
    const cacheKey = `webhook:uuid:${webhook.uuid}`
    try {
      await c.env.WEBHOOK_CACHE.put(cacheKey, webhook.id, { expirationTtl: 3600 })
      console.log(`📝 Cached webhook ID in KV: ${webhook.id}`)
    } catch (error) {
      console.error('⚠️  Failed to cache webhook ID:', error)
      // Continue even if caching fails
    }

    return c.json({ webhook }, 201)
  } catch (error) {
    if (error instanceof ValidationError) {
      return c.json({ error: error.message }, 400)
    }
    console.error('Error creating webhook:', error)
    return c.json({ error: 'Failed to create webhook' }, 500)
  }
}

/**
 * Delete webhook
 * DELETE /api/webhooks/:id
 */
export async function deleteWebhook(c: AppContext) {
  const user = c.get('user')
  const services = c.get('services')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const webhookId = c.req.param('id')

    if (!webhookId) {
      return c.json({ error: 'Webhook ID is required' }, 400)
    }

    // Get webhook to retrieve UUID before deletion
    const webhook = await services.webhooks.getWebhook(webhookId, user.id)

    // Delete webhook (cascades to shares and data)
    await services.webhooks.deleteWebhook(webhookId, user.id)

    // Invalidate KV cache
    const cacheKey = `webhook:uuid:${webhook.uuid}`
    try {
      await c.env.WEBHOOK_CACHE.delete(cacheKey)
      console.log(`🗑️  Deleted webhook cache: ${webhook.uuid}`)
    } catch (error) {
      console.error('⚠️  Failed to delete webhook cache:', error)
      // Continue even if cache deletion fails
    }

    return c.json({ success: true, message: 'Webhook deleted' })
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof UnauthorizedError) {
      return c.json({ error: error.message }, error.statusCode as 404 | 403)
    }
    console.error('Error deleting webhook:', error)
    return c.json({ error: 'Failed to delete webhook' }, 500)
  }
}

/**
 * Get webhook requests/data
 * GET /api/webhooks/:id/data
 */
export async function getWebhookData(c: AppContext) {
  const user = c.get('user')
  const services = c.get('services')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const webhookId = c.req.param('id')

    if (!webhookId) {
      return c.json({ error: 'Webhook ID is required' }, 400)
    }

    // Fetch recent webhook data (50 requests)
    const requests = await services.webhookData.getRecentWebhookData(webhookId, user.id, 50)

    return c.json({ requests })
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof UnauthorizedError) {
      return c.json({ error: error.message }, error.statusCode as 404 | 403)
    }
    console.error('Error fetching webhook data:', error)
    return c.json({ error: 'Failed to fetch webhook data' }, 500)
  }
}

/**
 * Update webhook (name and tags)
 * PATCH /api/webhooks/:id
 */
export async function updateWebhook(c: AppContext) {
  const user = c.get('user')
  const services = c.get('services')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const webhookId = c.req.param('id')

    if (!webhookId) {
      return c.json({ error: 'Webhook ID is required' }, 400)
    }

    const body = await c.req.json()
    const updated = await services.webhooks.updateWebhook(webhookId, user.id, body)

    return c.json({ webhook: updated })
  } catch (error) {
    if (error instanceof ValidationError) {
      return c.json({ error: error.message }, 400)
    }
    if (error instanceof NotFoundError || error instanceof UnauthorizedError) {
      return c.json({ error: error.message }, error.statusCode as 404 | 403)
    }
    console.error('Error updating webhook:', error)
    return c.json({ error: 'Failed to update webhook' }, 500)
  }
}
