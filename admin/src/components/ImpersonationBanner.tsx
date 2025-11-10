/**
 * ImpersonationBanner Component
 * Shows a prominent banner when admin is impersonating another user
 */

import { Button } from './ui/Button'
import { IconUserCircle, IconArrowBack } from '@tabler/icons-react'

interface ImpersonationBannerProps {
  userName?: string
  userEmail: string
}

export function ImpersonationBanner({ userName, userEmail }: ImpersonationBannerProps) {
  return (
    <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-l-4 border-amber-500 rounded-lg px-4 py-3 mb-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
              <IconUserCircle className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-xs font-medium text-amber-400 uppercase tracking-wide">Impersonating</span>
              <span className="text-sm font-semibold text-foreground truncate">
                {userName || userEmail}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Actions performed as this user
            </p>
          </div>
        </div>
        <div className="flex-shrink-0">
          <Button
            color="secondary"
            style="outline"
            size="sm"
            data-action="stop-impersonation"
            prefixIcon={IconArrowBack}
            className="whitespace-nowrap"
          >
            <span className="hidden sm:inline">Back to Admin</span>
            <span className="sm:hidden">Exit</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
