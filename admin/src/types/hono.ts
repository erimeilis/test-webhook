/**
 * Hono Types
 */

import type { Services } from '@/services'

export type Bindings = {
  DB: D1Database
  SESSIONS: KVNamespace
  WEBHOOK_CACHE: KVNamespace
  __STATIC_CONTENT: KVNamespace
  __STATIC_CONTENT_MANIFEST: string
  BASE_URL: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  RESEND_API_KEY: string
  FROM_EMAIL: string
  BETTER_AUTH_SECRET: string
  ENVIRONMENT: string
  WEBHOOK_WORKER_URL: string
  ADMIN_EMAIL: string
}

export type Variables = {
  user?: {
    id: string
    email: string
    name?: string
    role?: string
  }
  userId?: string
  isAdmin?: boolean
  isImpersonating?: boolean
  services: Services
}

export type Env = {
  Bindings: Bindings
  Variables: Variables
}
