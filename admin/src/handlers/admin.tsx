/**
 * Admin API Handlers (Refactored)
 * Admin-only endpoints for user management using service layer
 */

import type { Context } from 'hono'
import type { Bindings, Variables } from '@/types/hono'
import { UnauthorizedError } from '@/lib/errors'

type AppContext = Context<{ Bindings: Bindings; Variables: Variables }>

/**
 * Get all users with statistics
 * GET /api/admin/users
 */
export async function listUsers(c: AppContext) {
  const isAdmin = c.get('isAdmin')
  const userId = c.get('userId')
  const services = c.get('services')

  if (!isAdmin || !userId) {
    return c.json({ error: 'Unauthorized' }, 403)
  }

  try {
    const usersWithStats = await services.users.getAllUsersWithStats(userId)
    return c.json({ users: usersWithStats })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return c.json({ error: error.message }, error.statusCode as 403)
    }
    console.error('Error listing users:', error)
    return c.json({ error: 'Failed to list users' }, 500)
  }
}

/**
 * Impersonate a user
 * POST /api/admin/impersonate
 * Note: Better Auth admin plugin handles actual impersonation logic
 */
export async function impersonateUser(c: AppContext) {
  const isAdmin = c.get('isAdmin')

  if (!isAdmin) {
    return c.json({ error: 'Unauthorized' }, 403)
  }

  try {
    const { userId } = await c.req.json()

    if (!userId) {
      return c.json({ error: 'User ID is required' }, 400)
    }

    // Better Auth admin plugin provides impersonation via /api/auth/admin/impersonate
    // This endpoint validates admin status before delegating to Better Auth
    return c.json({ success: true, userId })
  } catch (error) {
    console.error('Error impersonating user:', error)
    return c.json({ error: 'Failed to impersonate user' }, 500)
  }
}

/**
 * Stop impersonation
 * POST /api/admin/stop-impersonation
 * Note: Better Auth admin plugin handles actual stop impersonation logic
 */
export async function stopImpersonation(c: AppContext) {
  const isAdmin = c.get('isAdmin')

  if (!isAdmin) {
    return c.json({ error: 'Unauthorized' }, 403)
  }

  // Better Auth admin plugin provides stop impersonation via /api/auth/admin/stop-impersonation
  // This endpoint validates admin status
  return c.json({ success: true })
}
