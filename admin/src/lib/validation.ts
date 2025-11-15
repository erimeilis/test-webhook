/**
 * Validation Schemas
 * Type-safe request validation using Zod
 */

import { z } from 'zod'
import { ValidationError } from './errors'

// Webhook Schemas
export const createWebhookSchema = z.object({
  name: z.string()
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name must not exceed 100 characters')
    .trim(),
  tags: z.array(z.string())
    .max(10, 'Maximum 10 tags allowed')
    .optional()
})

export const updateWebhookSchema = z.object({
  name: z.string()
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name must not exceed 100 characters')
    .trim(),
  tags: z.array(z.string())
    .max(10, 'Maximum 10 tags allowed')
    .optional()
})

// Webhook Share Schemas
export const shareWebhookSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  role: z.enum(['viewer', 'editor']).default('viewer')
})

export const updateShareRoleSchema = z.object({
  role: z.enum(['viewer', 'editor'])
})

// Request Filter Schemas
export const webhookDataFiltersSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(10),
  sortColumn: z.enum(['received_at', 'method', 'size_bytes']).default('received_at'),
  sortDirection: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  method: z.enum(['GET', 'POST']).optional(),
  dateStart: z.string().datetime().optional(),
  dateEnd: z.string().datetime().optional()
})

// User Profile Schemas
export const updateProfileSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(255, 'Name must not exceed 255 characters')
    .optional(),
  email: z.string()
    .email('Invalid email address')
    .toLowerCase()
    .optional()
})

// Type Inference
export type CreateWebhookInput = z.infer<typeof createWebhookSchema>
export type UpdateWebhookInput = z.infer<typeof updateWebhookSchema>
export type ShareWebhookInput = z.infer<typeof shareWebhookSchema>
export type UpdateShareRoleInput = z.infer<typeof updateShareRoleSchema>
export type WebhookDataFilters = z.infer<typeof webhookDataFiltersSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

/**
 * Validate data against a Zod schema
 * Throws ValidationError with detailed error messages
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)

  if (!result.success) {
    const errors: Record<string, string[]> = {}
    const zodErrors = result.error.issues

    zodErrors.forEach((err) => {
      const path = err.path.join('.')
      if (!errors[path]) {
        errors[path] = []
      }
      errors[path].push(err.message)
    })

    const firstError = zodErrors[0]
    const message = firstError?.message || 'Validation failed'
    throw new ValidationError(message, errors)
  }

  return result.data
}

/**
 * Parse query parameters with validation
 */
export function parseQueryParams<T>(
  schema: z.ZodSchema<T>,
  params: Record<string, string | string[]>
): T {
  // Convert string values to appropriate types
  const parsed: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      parsed[key] = value
    } else if (value === 'true' || value === 'false') {
      parsed[key] = value === 'true'
    } else if (!isNaN(Number(value)) && value !== '') {
      parsed[key] = Number(value)
    } else {
      parsed[key] = value
    }
  }

  return validate(schema, parsed)
}
