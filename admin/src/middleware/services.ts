/**
 * Services Middleware
 * Injects service layer into Hono context
 */

import { createMiddleware } from 'hono/factory'
import { ServiceFactory } from '@/services'
import type { Bindings, Variables } from '@/types/hono'
import type { KVNamespace } from '@cloudflare/workers-types'

/**
 * Middleware to inject services into context
 * Makes services available as c.var.services throughout the application
 */
export const servicesMiddleware = createMiddleware<{ Bindings: Bindings; Variables: Variables }>(
  async (c, next) => {
    // Create services from bindings
    const services = ServiceFactory.create(c.env.DB, c.env.WEBHOOK_CACHE as KVNamespace)

    // Inject into context
    c.set('services', services)

    await next()
  }
)
