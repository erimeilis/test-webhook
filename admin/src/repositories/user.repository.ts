/**
 * User Repository
 * Data access layer for users table
 */

import type { DrizzleD1Database } from 'drizzle-orm/d1'
import { eq, desc, sql } from 'drizzle-orm'
import { user, webhooks, webhookData } from '@/lib/db-schema'
import type { User, NewUser } from '@/lib/db-schema'
import * as schema from '@/lib/db-schema'

export interface UserWithStats {
  id: string
  email: string
  name: string | null
  role: string | null
  emailVerified: boolean
  createdAt: Date
  webhookCount: number
  requestCount: number
  totalBytes: number
}

export class UserRepository {
  constructor(private db: DrizzleD1Database<typeof schema>) {}

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    const result = await this.db
      .select()
      .from(user)
      .where(eq(user.id, id))
      .limit(1)

    return result[0] ?? null
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const result = await this.db
      .select()
      .from(user)
      .where(eq(user.email, email.toLowerCase()))
      .limit(1)

    return result[0] ?? null
  }

  /**
   * Get all users (for admin)
   */
  async findAll(): Promise<User[]> {
    return await this.db
      .select()
      .from(user)
      .orderBy(desc(user.createdAt))
      .all()
  }

  /**
   * Get all users with webhook and request stats (for admin panel)
   */
  async findAllWithStats(): Promise<UserWithStats[]> {
    // Get all users
    const allUsers = await this.db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      })
      .from(user)
      .orderBy(desc(user.createdAt))
      .all()

    // Get webhook counts for each user
    const webhookCounts = await this.db
      .select({
        userId: webhooks.userId,
        count: sql<number>`count(*)`.as('count'),
      })
      .from(webhooks)
      .groupBy(webhooks.userId)
      .all()

    // Get request counts and total bytes for each user
    const requestStats = await this.db
      .select({
        userId: webhooks.userId,
        requestCount: sql<number>`count(${webhookData.id})`.as('requestCount'),
        totalBytes: sql<number>`sum(${webhookData.sizeBytes})`.as('totalBytes'),
      })
      .from(webhooks)
      .leftJoin(webhookData, eq(webhooks.id, webhookData.webhookId))
      .groupBy(webhooks.userId)
      .all()

    // Combine all stats
    return allUsers.map(u => {
      const webhookCount = webhookCounts.find(wc => wc.userId === u.id)?.count || 0
      const stats = requestStats.find(rs => rs.userId === u.id)

      return {
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        emailVerified: u.emailVerified,
        createdAt: u.createdAt,
        webhookCount,
        requestCount: stats?.requestCount || 0,
        totalBytes: stats?.totalBytes || 0,
      }
    })
  }

  /**
   * Create a new user
   */
  async create(data: NewUser): Promise<User> {
    const id = crypto.randomUUID()
    const newUser: NewUser = {
      ...data,
      id,
      email: data.email.toLowerCase(),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await this.db.insert(user).values(newUser)

    const result = await this.db
      .select()
      .from(user)
      .where(eq(user.id, id))
      .limit(1)

    if (!result[0]) {
      throw new Error('Failed to create user')
    }

    return result[0]
  }

  /**
   * Update user profile
   */
  async update(id: string, data: Partial<NewUser>): Promise<User | null> {
    await this.db
      .update(user)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(user.id, id))

    return await this.findById(id)
  }

  /**
   * Check if user is admin
   */
  async isAdmin(id: string): Promise<boolean> {
    const foundUser = await this.findById(id)
    return foundUser?.role === 'admin'
  }
}
