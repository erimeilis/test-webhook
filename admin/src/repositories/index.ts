/**
 * Repository Factory
 * Creates and manages repository instances
 */

import type { D1Database } from '@cloudflare/workers-types'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from '@/lib/db-schema'
import { WebhookRepository } from './webhook.repository'
import { WebhookDataRepository } from './webhook-data.repository'
import { WebhookShareRepository } from './webhook-share.repository'
import { UserRepository } from './user.repository'

/**
 * Repository factory for creating repository instances
 * Provides type-safe data access layer
 */
export class RepositoryFactory {
  /**
   * Create all repositories from D1 database
   * @param db - Cloudflare D1 database instance
   */
  static create(db: D1Database) {
    const drizzleDb = drizzle(db, { schema })

    return {
      webhooks: new WebhookRepository(drizzleDb),
      webhookData: new WebhookDataRepository(drizzleDb),
      webhookShares: new WebhookShareRepository(drizzleDb),
      users: new UserRepository(drizzleDb),

      // Expose Drizzle instance for direct queries if needed
      _db: drizzleDb
    }
  }
}

// Export repository factory type for use in services
export type Repositories = ReturnType<typeof RepositoryFactory.create>

// Re-export repositories for direct imports
export { WebhookRepository } from './webhook.repository'
export { WebhookDataRepository } from './webhook-data.repository'
export { WebhookShareRepository } from './webhook-share.repository'
export { UserRepository } from './user.repository'

// Re-export types
export type {
  WebhookDataFilters,
  PaginatedResult
} from './webhook-data.repository'

export type {
  SharedWebhookDetails
} from './webhook-share.repository'

export type {
  UserWithStats
} from './user.repository'
