/**
 * Custom Error Classes
 * Provides structured error handling with HTTP status codes
 */

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`, 'NOT_FOUND')
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'You do not have permission to access this resource') {
    super(403, message, 'UNAUTHORIZED')
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public errors?: Record<string, string[]>) {
    super(400, message, 'VALIDATION_ERROR')
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message, 'CONFLICT')
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(429, message, 'RATE_LIMIT_EXCEEDED')
  }
}

export class QuotaExceededError extends AppError {
  constructor(resource: string, limit: number) {
    super(403, `${resource} quota exceeded (limit: ${limit})`, 'QUOTA_EXCEEDED')
  }
}
