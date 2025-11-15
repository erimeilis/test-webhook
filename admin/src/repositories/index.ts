/**
 * Repository Factory
 * Creates and manages repository instances
 */

import type { D1Database } from '@cloudflare/workers-types'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from '@/lib/db-schema'

/**
 * Repository factory for creating repository instances
 * Repositories will be added in Phase 2
 */
export class RepositoryFactory {
  /**
   * Create all repositories from D1 database
   * @param db - Cloudflare D1 database instance
   */
  static create(db: D1Database) {
    const drizzleDb = drizzle(db, { schema })

    return {
      // Repositories will be added here in Phase 2:
      // webhooks: new WebhookRepository(drizzleDb),
      // webhookData: new WebhookDataRepository(drizzleDb),
      // webhookShares: new WebhookShareRepository(drizzleDb),
      // users: new UserRepository(drizzleDb),

      // Placeholder for now
      _db: drizzleDb
    }
  }
}

// Export repository factory type for use in services
export type Repositories = ReturnType<typeof RepositoryFactory.create>
