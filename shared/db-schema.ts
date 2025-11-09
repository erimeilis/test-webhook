/**
 * Shared Drizzle Schema
 * Used by both admin and webhook workers
 */

// @ts-ignore - Module resolution works at runtime from parent projects
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'

// Better Auth: Users table
export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table: ReturnType<typeof sqliteTable>) => ({
  emailIdx: index('user_email_idx').on(table.email),
}))

// Better Auth: Session table
export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
}, (table: ReturnType<typeof sqliteTable>) => ({
  tokenIdx: index('session_token_idx').on(table.token),
  userIdIdx: index('session_user_id_idx').on(table.userId),
}))

// Better Auth: Account table (for OAuth)
export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table: ReturnType<typeof sqliteTable>) => ({
  providerIdx: index('account_provider_idx').on(table.providerId, table.accountId),
  userIdIdx: index('account_user_id_idx').on(table.userId),
}))

// Better Auth: Verification table
export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
}, (table: ReturnType<typeof sqliteTable>) => ({
  identifierIdx: index('verification_identifier_idx').on(table.identifier),
}))

// Backwards compatibility alias
export const users = user

// Webhooks table
export const webhooks = sqliteTable('webhooks', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  uuid: text('uuid').notNull().unique(),
  name: text('name').notNull(),
  tags: text('tags'), // JSON array
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table: ReturnType<typeof sqliteTable>) => ({
  userIdIdx: index('webhook_user_id_idx').on(table.userId),
  uuidIdx: index('webhook_uuid_idx').on(table.uuid),
}))

// Webhook data table
export const webhookData = sqliteTable('webhook_data', {
  id: text('id').primaryKey(),
  webhookId: text('webhook_id').notNull().references(() => webhooks.id, { onDelete: 'cascade' }),
  method: text('method').notNull(), // GET or POST
  headers: text('headers').notNull(), // JSON string
  data: text('data').notNull(), // JSON string of body/query params
  sizeBytes: integer('size_bytes').notNull(),
  receivedAt: integer('received_at', { mode: 'timestamp' }).notNull(),
}, (table: ReturnType<typeof sqliteTable>) => ({
  webhookIdIdx: index('webhook_data_webhook_id_idx').on(table.webhookId),
  receivedAtIdx: index('webhook_data_received_at_idx').on(table.receivedAt),
}))

// Webhook shares table (collaboration)
export const webhookShares = sqliteTable('webhook_shares', {
  id: text('id').primaryKey(),
  webhookId: text('webhook_id').notNull().references(() => webhooks.id, { onDelete: 'cascade' }),
  sharedWithEmail: text('shared_with_email').notNull(),
  sharedWithUserId: text('shared_with_user_id').references(() => users.id, { onDelete: 'cascade' }),
  invitedByUserId: text('invited_by_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // 'owner' or 'collaborator'
  invitedAt: integer('invited_at', { mode: 'timestamp' }).notNull(),
  acceptedAt: integer('accepted_at', { mode: 'timestamp' }),
}, (table: ReturnType<typeof sqliteTable>) => ({
  webhookIdIdx: index('webhook_share_webhook_id_idx').on(table.webhookId),
  sharedWithEmailIdx: index('webhook_share_email_idx').on(table.sharedWithEmail),
  sharedWithUserIdx: index('webhook_share_user_id_idx').on(table.sharedWithUserId),
}))

// Types for TypeScript
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type Webhook = typeof webhooks.$inferSelect
export type NewWebhook = typeof webhooks.$inferInsert

export type WebhookData = typeof webhookData.$inferSelect
export type NewWebhookData = typeof webhookData.$inferInsert

export type WebhookShare = typeof webhookShares.$inferSelect
export type NewWebhookShare = typeof webhookShares.$inferInsert
