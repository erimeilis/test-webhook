/**
 * Database Seeder
 * Creates test users and webhooks for development
 */

import { drizzle } from 'drizzle-orm/d1'
import { user, account, webhooks } from '@shared/db-schema'

// Hash password using SHA-256 (Better Auth compatible)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function seed(env: any) {
  const db = drizzle(env.DB)

  console.log('🌱 Starting database seeding...')

  // Create test users
  const testUsers = [
    {
      id: crypto.randomUUID(),
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    },
    {
      id: crypto.randomUUID(),
      name: 'Demo User',
      email: 'demo@example.com',
      password: 'demo123',
    },
  ]

  for (const userData of testUsers) {
    try {
      const now = new Date()

      // Insert user
      await db.insert(user).values({
        id: userData.id,
        name: userData.name,
        email: userData.email,
        emailVerified: true,
        image: null,
        createdAt: now,
        updatedAt: now,
      })

      // Insert account with hashed password
      await db.insert(account).values({
        id: crypto.randomUUID(),
        accountId: userData.email,
        providerId: 'credential',
        userId: userData.id,
        password: await hashPassword(userData.password),
        accessToken: null,
        refreshToken: null,
        idToken: null,
        accessTokenExpiresAt: null,
        refreshTokenExpiresAt: null,
        scope: null,
        createdAt: now,
        updatedAt: now,
      })

      console.log(`✅ Created user: ${userData.email} (password: ${userData.password})`)

      // Create sample webhooks for the user
      const sampleWebhooks = [
        {
          id: crypto.randomUUID(),
          userId: userData.id,
          uuid: crypto.randomUUID(),
          name: 'Production API Webhook',
          tags: JSON.stringify(['production', 'api']),
          createdAt: now,
        },
        {
          id: crypto.randomUUID(),
          userId: userData.id,
          uuid: crypto.randomUUID(),
          name: 'Staging Environment',
          tags: JSON.stringify(['staging', 'testing']),
          createdAt: now,
        },
        {
          id: crypto.randomUUID(),
          userId: userData.id,
          uuid: crypto.randomUUID(),
          name: 'Development Webhook',
          tags: JSON.stringify(['dev']),
          createdAt: now,
        },
      ]

      for (const webhook of sampleWebhooks) {
        await db.insert(webhooks).values(webhook)
      }

      console.log(`  📦 Created ${sampleWebhooks.length} sample webhooks`)
    } catch (error: any) {
      if (error.message?.includes('UNIQUE constraint failed')) {
        console.log(`⏭️  User ${userData.email} already exists, skipping...`)
      } else {
        console.error(`❌ Error creating user ${userData.email}:`, error)
      }
    }
  }

  console.log('\n🎉 Seeding completed!')
  console.log('\n📝 Test Accounts:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Email: test@example.com')
  console.log('Password: password123')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Email: demo@example.com')
  console.log('Password: demo123')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

// Export for wrangler script usage
export default {
  async fetch(_request: Request, env: any) {
    try {
      await seed(env)
      return new Response('Database seeded successfully!', {
        headers: { 'Content-Type': 'text/plain' },
      })
    } catch (error: any) {
      return new Response(`Error seeding database: ${error.message}`, {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      })
    }
  },
}
