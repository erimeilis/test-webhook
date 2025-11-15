/**
 * Webhook Data Repository
 * Data access layer for webhook_data table
 */

import type { DrizzleD1Database } from 'drizzle-orm/d1'
import { eq, and, desc, asc, sql } from 'drizzle-orm'
import { webhookData } from '@/lib/db-schema'
import type { WebhookData, NewWebhookData } from '@/lib/db-schema'
import * as schema from '@/lib/db-schema'

export interface WebhookDataFilters {
  page?: number
  pageSize?: number
  sortColumn?: 'received_at' | 'method' | 'size_bytes'
  sortDirection?: 'asc' | 'desc'
  search?: string
  method?: 'GET' | 'POST'
  dateStart?: string
  dateEnd?: string
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export class WebhookDataRepository {
  constructor(private db: DrizzleD1Database<typeof schema>) {}

  /**
   * Find webhook data by webhook ID with filters
   */
  async findByWebhookId(
    webhookId: string,
    filters: WebhookDataFilters = {}
  ): Promise<PaginatedResult<WebhookData>> {
    const {
      page = 1,
      pageSize = 10,
      sortColumn = 'received_at',
      sortDirection = 'desc',
      search,
      method,
      dateStart,
      dateEnd
    } = filters

    // Build WHERE conditions
    const conditions = [eq(webhookData.webhookId, webhookId)]

    // Method filter
    if (method) {
      conditions.push(eq(webhookData.method, method))
    }

    // Date range filter
    if (dateStart && dateEnd) {
      const startTimestamp = Math.floor(new Date(dateStart).getTime() / 1000)
      const endTimestamp = Math.floor(new Date(dateEnd).getTime() / 1000) + (24 * 60 * 60)
      conditions.push(
        sql`${webhookData.receivedAt} >= ${startTimestamp} AND ${webhookData.receivedAt} < ${endTimestamp}`
      )
    }

    // Search filter (search in data and headers)
    if (search) {
      conditions.push(
        sql`(${webhookData.data} LIKE ${'%' + search + '%'} OR ${webhookData.headers} LIKE ${'%' + search + '%'})`
      )
    }

    // Sorting
    const orderByColumn = sortColumn === 'received_at' ? webhookData.receivedAt :
                         sortColumn === 'method' ? webhookData.method :
                         sortColumn === 'size_bytes' ? webhookData.sizeBytes :
                         webhookData.receivedAt
    const orderByDirection = sortDirection === 'asc' ? asc : desc

    // Pagination
    const offset = (page - 1) * pageSize

    // Get data
    const data = await this.db
      .select()
      .from(webhookData)
      .where(and(...conditions))
      .orderBy(orderByDirection(orderByColumn))
      .limit(pageSize)
      .offset(offset)
      .all()

    // Get total count
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(webhookData)
      .where(and(...conditions))
      .get()

    const total = countResult?.count || 0

    return {
      data,
      total,
      page,
      pageSize
    }
  }

  /**
   * Find recent webhook data (no filters)
   */
  async findRecentByWebhookId(webhookId: string, limit: number = 50): Promise<WebhookData[]> {
    return await this.db
      .select()
      .from(webhookData)
      .where(eq(webhookData.webhookId, webhookId))
      .orderBy(desc(webhookData.receivedAt))
      .limit(limit)
      .all()
  }

  /**
   * Create webhook data entry
   */
  async create(data: NewWebhookData): Promise<WebhookData> {
    const id = crypto.randomUUID()
    const entry: NewWebhookData = {
      ...data,
      id,
      receivedAt: new Date()
    }

    await this.db.insert(webhookData).values(entry)

    const result = await this.db
      .select()
      .from(webhookData)
      .where(eq(webhookData.id, id))
      .limit(1)

    if (!result[0]) {
      throw new Error('Failed to create webhook data')
    }

    return result[0]
  }

  /**
   * Delete all data for a webhook (cascade delete)
   */
  async deleteByWebhookId(webhookId: string): Promise<number> {
    const result = await this.db
      .delete(webhookData)
      .where(eq(webhookData.webhookId, webhookId))

    return result.meta.changes ?? 0
  }

  /**
   * Get total size for a webhook
   */
  async getTotalSizeByWebhookId(webhookId: string): Promise<number> {
    const result = await this.db
      .select({ totalSize: sql<number>`sum(${webhookData.sizeBytes})` })
      .from(webhookData)
      .where(eq(webhookData.webhookId, webhookId))
      .get()

    return result?.totalSize || 0
  }

  /**
   * Get request count by method for a webhook
   */
  async getMethodCountsByWebhookId(webhookId: string): Promise<{ GET: number; POST: number }> {
    const data = await this.db
      .select()
      .from(webhookData)
      .where(eq(webhookData.webhookId, webhookId))
      .all()

    return {
      GET: data.filter(d => d.method === 'GET').length,
      POST: data.filter(d => d.method === 'POST').length
    }
  }
}
