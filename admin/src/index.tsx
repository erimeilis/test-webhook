/**
 * Webhook Admin Panel Entry Point
 * Hono app with React JSX rendering
 */

import { Hono } from 'hono'
import type { ScheduledEvent, ExecutionContext } from '@cloudflare/workers-types'
import { reactRenderer } from '@hono/react-renderer'
import { getAssetFromKV } from '@cloudflare/kv-asset-handler'
// @ts-expect-error - This is provided by Wrangler
import manifest from '__STATIC_CONTENT_MANIFEST'
import type { Bindings, Variables } from '@/types/hono'
import { createAuth } from '@/lib/auth'
import { handleLoginPage, handleSignupPage, handleVerifyEmailPage, handleResetPasswordPage } from '@/handlers/auth'
import { handleDashboard } from '@/handlers/dashboard'
import { listWebhooks, createWebhook, updateWebhook, deleteWebhook, getWebhookData } from '@/handlers/webhooks'
import { getCodeExamples } from '@/handlers/code-examples'
import { shareWebhook, listCollaborators, removeCollaborator } from '@/handlers/webhook-sharing'
import { listUsers, impersonateUser, stopImpersonation } from '@/handlers/admin'
import { cleanupOldData } from '@/handlers/cleanup'
import { authMiddleware } from '@/middleware/auth'

// Initialize Hono app
const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Global error handler
app.onError((err, c) => {
  console.error('🚨 Global error handler caught:', err)
  console.error('🚨 Error stack:', err.stack)
  console.error('🚨 Request path:', c.req.path)
  console.error('🚨 Request method:', c.req.method)
  return c.json({ error: 'Internal server error', message: err.message }, 500)
})

// React renderer setup with dark theme
app.use('*', reactRenderer(({ children }) => {
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="dark" />
        <title>Webhook System</title>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body className="dark:bg-background dark:text-foreground">
        {children}
        <script type="module" src="/client.js"></script>
      </body>
    </html>
  )
}))

// Note: OAuth users can use Better Auth's built-in reset-password flow
// The auto-generation hook creates a credential account with a random password,
// so all users (OAuth or not) can use the same password reset flow

// Better Auth API routes - only handle /api/auth/* routes
app.on(['GET', 'POST'], '/api/auth/*', async (c) => {
  console.log('🔐 Auth route called:', c.req.method, c.req.url)
  try {
    const auth = createAuth(c.env)
    console.log('🔐 Calling Better Auth handler...')
    const response = await auth.handler(c.req.raw)
    console.log('🔐 Response status:', response.status)

    // Log response details for debugging
    const responseClone = response.clone()
    const responseText = await responseClone.text()
    console.log('🔐 Response body preview:', responseText.substring(0, 200))

    return response
  } catch (error) {
    console.error('🔐 Error in auth handler:', error)
    console.error('🔐 Error stack:', error instanceof Error ? error.stack : 'No stack')
    return c.json({ error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})

// Test route to verify server is working
app.post('/api/test-impersonate', async (c) => {
  console.log('🧪 Test impersonate route called')
  return c.json({ message: 'Test endpoint working' })
})

// Health check route
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: Date.now() })
})

// Test cleanup route (for development/testing)
app.post('/api/test-cleanup', authMiddleware, async (c) => {
  try {
    console.log('🧹 Manual cleanup triggered by:', c.var.user?.id)
    const result = await cleanupOldData(c.env)
    return c.json({
      success: true,
      deletedCount: result.deletedCount,
      cutoffDate: result.cutoffDate.toISOString(),
      message: `Deleted ${result.deletedCount} records older than ${result.cutoffDate.toISOString()}`
    })
  } catch (error) {
    console.error('🚨 Manual cleanup error:', error)
    return c.json({
      error: 'Cleanup failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})


// Webhook API routes (protected)
app.get('/api/webhooks', authMiddleware, listWebhooks)
app.post('/api/webhooks', authMiddleware, createWebhook)
app.patch('/api/webhooks/:id', authMiddleware, updateWebhook)
app.delete('/api/webhooks/:id', authMiddleware, deleteWebhook)
app.get('/api/webhooks/:id/data', authMiddleware, getWebhookData)
app.get('/api/webhooks/:id/examples', authMiddleware, getCodeExamples)
app.post('/api/webhooks/:id/share', authMiddleware, shareWebhook)
app.get('/api/webhooks/:id/collaborators', authMiddleware, listCollaborators)
app.delete('/api/webhooks/:id/shares/:shareId', authMiddleware, removeCollaborator)

// Admin API routes (admin-only)
app.get('/api/admin/users', authMiddleware, listUsers)
app.post('/api/admin/impersonate', authMiddleware, impersonateUser)
app.post('/api/admin/stop-impersonation', authMiddleware, stopImpersonation)

// Public routes
app.get('/', async (c) => {
  // Check if user is authenticated
  const auth = createAuth(c.env)
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  })

  // Redirect based on authentication status
  if (session) {
    return c.redirect('/dashboard')
  } else {
    return c.redirect('/login')
  }
})

app.get('/login', handleLoginPage)
app.get('/signup', handleSignupPage)
app.get('/verify-email', handleVerifyEmailPage)
app.get('/reset-password', handleResetPasswordPage)

// Protected routes
app.get('/dashboard', authMiddleware, handleDashboard)
app.get('/dashboard/:id', authMiddleware, handleDashboard)

// Static assets
app.get('*', async (c) => {
  const url = new URL(c.req.url)

  // Only serve static assets for specific paths
  if (url.pathname.startsWith('/styles.css') || url.pathname.startsWith('/client.js') || url.pathname.startsWith('/favicon.svg')) {
    try {
      return await getAssetFromKV(
        {
          request: c.req.raw,
          waitUntil: () => {},
        },
        {
          ASSET_NAMESPACE: c.env.__STATIC_CONTENT,
          ASSET_MANIFEST: JSON.parse(manifest),
        }
      )
    } catch (error) {
      console.error('Asset error:', error)
      return new Response('Asset not found', { status: 404 })
    }
  }

  // Not a static asset, continue to other routes
  return c.notFound()
})

// Export both the Hono app (for HTTP requests) and scheduled handler (for cron triggers)
export default {
  // Handle regular HTTP requests
  fetch: app.fetch,

  // Handle scheduled events (cron triggers)
  async scheduled(
    controller: ScheduledEvent,
    env: Bindings,
    _ctx: ExecutionContext
  ): Promise<void> {
    console.log('⏰ Scheduled cleanup triggered at:', new Date(controller.scheduledTime).toISOString())

    try {
      const result = await cleanupOldData(env)
      console.log(`✅ Cleanup successful: deleted ${result.deletedCount} records older than ${result.cutoffDate.toISOString()}`)
      if (result.deletedCount > 0 && env.ADMIN_EMAIL) {
        console.log(`📧 Email notification sent to ${env.ADMIN_EMAIL}`)
      }
    } catch (error) {
      console.error('❌ Scheduled cleanup failed:', error)
      // Don't throw - just log the error so the worker doesn't fail
    }
  }
}
