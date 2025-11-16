/**
 * Gravatar Utilities
 * Generate Gravatar URLs from email addresses
 */

import { md5 } from './crypto'

/**
 * Generate Gravatar URL from email address
 * @param email - User's email address
 * @param size - Avatar size in pixels (default: 32)
 * @returns Gravatar URL
 */
export function getGravatarUrl(email: string | undefined, size: number = 32): string {
  if (!email) {
    return `https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&s=${size}`
  }

  const hash = md5(email.toLowerCase().trim())
  return `https://www.gravatar.com/avatar/${hash}?d=mp&s=${size}`
}
