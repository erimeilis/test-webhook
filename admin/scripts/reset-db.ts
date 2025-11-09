/**
 * Reset Local Database
 * Clears all data from the local development database
 */

import { drizzle } from 'drizzle-orm/d1'
import { user, account, session, verification, webhooks, webhookShares, webhookData } from '@shared/db-schema'

interface Env {
  DB: D1Database
}

export default {
  async fetch(_request: Request, env: Env): Promise<Response> {
    const db = drizzle(env.DB)

    console.log('🗑️  Resetting local database...')

    try {
      // Delete in correct order (respecting foreign keys)
      console.log('  Deleting webhook_data...')
      await db.delete(webhookData)

      console.log('  Deleting webhook_shares...')
      await db.delete(webhookShares)

      console.log('  Deleting webhooks...')
      await db.delete(webhooks)

      console.log('  Deleting verification tokens...')
      await db.delete(verification)

      console.log('  Deleting sessions...')
      await db.delete(session)

      console.log('  Deleting accounts...')
      await db.delete(account)

      console.log('  Deleting users...')
      await db.delete(user)

      console.log('✅ Database reset complete!')
      console.log('')
      console.log('All tables cleared:')
      console.log('  - user')
      console.log('  - account')
      console.log('  - session')
      console.log('  - verification')
      console.log('  - webhooks')
      console.log('  - webhook_shares')
      console.log('  - webhook_data')

      return new Response('Database reset complete', { status: 200 })
    } catch (error) {
      console.error('❌ Error resetting database:', error)
      return new Response('Error resetting database', { status: 500 })
    }
  },
}
