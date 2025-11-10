/**
 * WebhookFilters Component
 * Displays active filter state and clear button
 */

interface WebhookFiltersProps {
  activeTag?: string
}

// Tag color mapping (matches routing.tsx)
function getTagColor(tag: string): string {
  const colors = ['blue', 'green', 'yellow', 'red', 'purple', 'pink', 'orange', 'cyan']
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length] || 'blue'
}

export function WebhookFilters({ activeTag }: WebhookFiltersProps) {
  if (!activeTag) return null

  const tagColor = getTagColor(activeTag as string)
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    pink: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  }

  return (
    <div className="bg-background border border-border rounded-lg p-4 flex items-center justify-between">
      <span className="text-sm flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
        Filtering by tag:
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${colorClasses[tagColor]}`}>
          {activeTag}
        </span>
      </span>

      <a
        href="/dashboard"
        className="p-1 hover:bg-muted rounded transition-colors"
        title="Clear filter"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </a>
    </div>
  )
}
