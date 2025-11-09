/**
 * Webhook-related TypeScript types
 */

export interface Webhook {
  id: string
  userId: string
  uuid: string
  name: string
  tags: string | null
  createdAt: Date
}

export interface WebhookData extends Record<string, unknown> {
  id: string
  webhook_id: string
  method: 'GET' | 'POST'
  headers: string
  data: string
  size_bytes: number
  received_at: number
}

export interface CodeExample {
  language: string
  code: string
}

export interface Collaborator {
  id: string
  sharedWithEmail: string
  sharedWithUserId?: string | null
  role: 'owner' | 'collaborator'
  invitedAt: Date | string
  acceptedAt?: Date | string | null
}

export interface EditWebhookFormData {
  name: string
  tags: string
}
