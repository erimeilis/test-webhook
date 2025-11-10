/**
 * Auth Middleware
 * Protects routes requiring authentication
 */

import { createMiddleware } from 'hono/factory'
import type { Bindings, Variables } from '@/types/hono'
import { createAuth } from '@/lib/auth'
import { drizzle } from 'drizzle-orm/d1'
import { webhooks, user as userTable } from '@/lib/db-schema'
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

      const db = drizzle(c.env.DB)

      // Check if user is admin and update role if needed
      const adminEmail = c.env.ADMIN_EMAIL?.toLowerCase()
      const userEmail = session.user.email.toLowerCase()
      const isAdmin = adminEmail === userEmail

      // If user is admin but doesn't have admin role, update it
      if (isAdmin && session.user.role !== 'admin') {
        try {
          await db.update(userTable)
            .set({ role: 'admin' })
            .where(eq(userTable.id, session.user.id))
          console.log('✅ Updated user role to admin:', userEmail)
        } catch (error) {
          console.error('❌ Failed to update user role:', error)
        }
      }

      // Check if this session is an impersonation
      const isImpersonating = !!(session.session as { impersonatedBy?: string }).impersonatedBy

      // Set user in context with role
      c.set('user', {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: isAdmin ? 'admin' : session.user.role || 'user',
      })

      // Set isAdmin flag
      c.set('isAdmin', isAdmin)

      // Set impersonation flag
      c.set('isImpersonating', isImpersonating)

      // Auto-create default webhook for new users
      try {
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
