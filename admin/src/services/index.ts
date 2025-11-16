/**
 * Service Factory
 * Creates and manages service instances
 */

import type { D1Database } from '@cloudflare/workers-types'
import type { KVNamespace } from '@cloudflare/workers-types'
import { RepositoryFactory } from '@/repositories'
import { WebhookService } from './webhook.service'
import { WebhookDataService } from './webhook-data.service'
import { WebhookShareService } from './webhook-share.service'
import { UserService } from './user.service'

/**
 * Service factory for creating service instances
 * Provides business logic layer with dependency injection
 */
export class ServiceFactory {
  /**
   * Create all services from bindings
   * @param db - Cloudflare D1 database instance
   * @param _cache - Cloudflare KV namespace for caching (reserved for future use)
   */
  static create(db: D1Database, _cache: KVNamespace) {
    const repositories = RepositoryFactory.create(db)

    return {
      webhooks: new WebhookService(repositories),
      webhookData: new WebhookDataService(repositories),
      webhookShares: new WebhookShareService(repositories),
      users: new UserService(repositories),

      // Expose repositories for direct access (temporary, for gradual migration)
      _repositories: repositories
    }
  }
}

// Export service factory type for use in middleware
export type Services = ReturnType<typeof ServiceFactory.create>

// Re-export services for direct imports
export { WebhookService } from './webhook.service'
export { WebhookDataService } from './webhook-data.service'
export { WebhookShareService } from './webhook-share.service'
export { UserService } from './user.service'
