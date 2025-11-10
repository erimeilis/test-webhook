/**
 * Auth Middleware
 * Protects routes requiring authentication
 */

import { createMiddleware } from 'hono/factory'
import type { Bindings, Variables } from '@/types/hono'
import { createAuth } from '@/lib/auth'
import { drizzle } from 'drizzle-orm/d1'
import { webhooks } from '@/lib/db-schema'
import { eq } from 'drizzle-orm'

export const authMiddleware = createMiddleware<{ Bindings: Bindings; Variables: Variables }>(
  async (c, next) => {
    try {
      const auth = createAuth(c.env)

      // Get session from cookie
      const session = await auth.api.getSession({
        headers: c.req.raw.headers,
      })

      if (!session) {
        return c.redirect('/login?error=unauthorized')
      }

      // Set user in context
      c.set('user', {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      })

      // Auto-create default webhook for new users
      try {
        const db = drizzle(c.env.DB)
        const userWebhooks = await db
          .select()
          .from(webhooks)
          .where(eq(webhooks.userId, session.user.id))
          .limit(1)

        if (userWebhooks.length === 0) {
          // Create default webhook
          const now = new Date()
          await db.insert(webhooks).values({
            id: crypto.randomUUID(),
            userId: session.user.id,
            uuid: crypto.randomUUID(),
            name: 'My First Webhook',
            tags: null,
            createdAt: now,
          })
        }
      } catch (error) {
        console.error('Error creating default webhook:', error)
        // Don't block the request if webhook creation fails
      }

      await next()
    } catch (error) {
      console.error('❌ Auth middleware error:', error)
      // If session retrieval fails, redirect to login
      return c.redirect('/login?error=session_failed')
    }
  }
)
