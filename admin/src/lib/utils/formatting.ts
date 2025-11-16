/**
 * Formatting Utilities
 * Format dates, file sizes, and other display values
 */

/**
 * Format bytes to human-readable size
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "1.5 KB", "2.3 MB")
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

/**
 * Format timestamp to date string
 * @param timestamp - Unix timestamp (seconds)
 * @returns Formatted date (e.g., "Nov 15, 2025")
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  const monthShort = date.toLocaleDateString('en-US', { month: 'short' })
  const day = date.getDate()
  const year = date.getFullYear()
  return `${monthShort} ${day}, ${year}`
}

/**
 * Format timestamp to time string
 * @param timestamp - Unix timestamp (seconds)
 * @returns Formatted time (e.g., "14:30")
 */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

/**
 * Format timestamp to full datetime string
 * @param timestamp - Unix timestamp (seconds)
 * @returns Formatted datetime with weekday (e.g., "Nov 15, 2025 - Fri, 14:30")
 */
export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  const monthShort = date.toLocaleDateString('en-US', { month: 'short' })
  const day = date.getDate()
  const year = date.getFullYear()
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' })
  const time = formatTime(timestamp)

  return `${monthShort} ${day}, ${year} - ${weekday}, ${time}`
}

/**
 * Format timestamp to relative time
 * @param timestamp - Unix timestamp (seconds)
 * @returns Relative time string (e.g., "2 hours ago", "just now")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000)
  const diff = now - timestamp

  if (diff < 60) return 'just now'
  if (diff < 3600) {
    const minutes = Math.floor(diff / 60)
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
  }
  if (diff < 86400) {
    const hours = Math.floor(diff / 3600)
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  }
  if (diff < 604800) {
    const days = Math.floor(diff / 86400)
    return `${days} ${days === 1 ? 'day' : 'days'} ago`
  }

  return formatDate(timestamp)
}
