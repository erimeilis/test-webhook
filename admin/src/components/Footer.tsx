/**
 * Footer Component
 * Displays version number and build datetime
 */

import { BUILD_INFO } from '@/lib/build-info'
import { format } from 'date-fns'

export function Footer() {
  const buildDate = new Date(BUILD_INFO.buildTime)
  const formattedDate = format(buildDate, 'yyyy-MM-dd HH:mm:ss')

  return (
    <footer className="border-t border-border bg-muted/30 py-4 px-6 mt-auto">
      <div className="flex items-center justify-center gap-3 text-[10px] text-muted">
        <span>
          Version <span className="font-mono font-semibold">{BUILD_INFO.version}</span>
        </span>
        <span>•</span>
        <span>
          Built <span className="font-mono">{formattedDate}</span>
        </span>
      </div>
    </footer>
  )
}
