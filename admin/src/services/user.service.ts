/**
 * User Service
 * Business logic layer for user operations
 */

import type { Repositories } from '@/repositories'
import type { User } from '@/lib/db-schema'
import type { UserWithStats } from '@/repositories/user.repository'
import { NotFoundError, UnauthorizedError } from '@/lib/errors'

export class UserService {
  constructor(private repos: Repositories) {}

  /**
   * Get user by ID
   */
  async getUser(userId: string): Promise<User> {
    const user = await this.repos.users.findById(userId)
    if (!user) {
      throw new NotFoundError('User not found')
    }
    return user
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    return await this.repos.users.findByEmail(email)
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(requestingUserId: string): Promise<User[]> {
    // Verify admin
    await this.verifyAdmin(requestingUserId)

    return await this.repos.users.findAll()
  }

  /**
   * Get all users with stats (admin only)
   */
  async getAllUsersWithStats(requestingUserId: string): Promise<UserWithStats[]> {
    // Verify admin
    await this.verifyAdmin(requestingUserId)

    return await this.repos.users.findAllWithStats()
  }

  /**
   * Check if user is admin
   */
  async isAdmin(userId: string): Promise<boolean> {
    return await this.repos.users.isAdmin(userId)
  }

  /**
   * Verify user is admin, throw error if not
   */
  async verifyAdmin(userId: string): Promise<void> {
    const admin = await this.repos.users.isAdmin(userId)
    if (!admin) {
      throw new UnauthorizedError('Admin access required')
    }
  }

  /**
   * Update user profile
   */
  async updateUser(userId: string, data: { name?: string; email?: string }): Promise<User> {
    // Get existing user
    const existing = await this.repos.users.findById(userId)
    if (!existing) {
      throw new NotFoundError('User not found')
    }

    // Update user
    const updated = await this.repos.users.update(userId, data)
    if (!updated) {
      throw new Error('Failed to update user')
    }

    return updated
  }
}
