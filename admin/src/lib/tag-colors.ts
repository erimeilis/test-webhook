/**
 * Tag color utilities
 * Deterministically assign colors to tags based on their text
 */

export type TagVariant = 'default' | 'secondary' | 'success' | 'warning' | 'error'

const TAG_COLORS: TagVariant[] = ['default', 'success', 'warning', 'error', 'secondary']

/**
 * Get a consistent color for a tag based on its text
 */
export function getTagColor(tag: string): TagVariant {
  // Simple hash function
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = ((hash << 5) - hash) + tag.charCodeAt(i)
    hash = hash & hash // Convert to 32-bit integer
  }

  // Get absolute value and map to color array
  const index = Math.abs(hash) % TAG_COLORS.length
  return TAG_COLORS[index] || 'default'
}
