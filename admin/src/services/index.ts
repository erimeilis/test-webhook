/**
 * Service Factory
 * Creates and manages service instances
 */

import type { D1Database } from '@cloudflare/workers-types'
import type { KVNamespace } from '@cloudflare/workers-types'
import { RepositoryFactory } from '@/repositories'

/**
 * Service factory for creating service instances
 * Services will be added in Phase 3
 */
export class ServiceFactory {
  /**
   * Create all services from bindings
   * @param db - Cloudflare D1 database instance
   * @param _cache - Cloudflare KV namespace for caching (will be used in Phase 3)
   */
  static create(db: D1Database, _cache: KVNamespace) {
    const repositories = RepositoryFactory.create(db)

    return {
      // Services will be added here in Phase 3:
      // webhooks: new WebhookService(repositories, cache),
      // admin: new AdminService(repositories),
      // users: new UserService(repositories),

      // Expose repositories for direct access (temporary, for gradual migration)
      _repositories: repositories
    }
  }
}

// Export service factory type for use in middleware
export type Services = ReturnType<typeof ServiceFactory.create>
