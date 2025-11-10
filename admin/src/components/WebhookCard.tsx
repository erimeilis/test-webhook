/**
 * WebhookCard Component
 * Displays a single webhook with actions
 */

import { Button } from './ui/Button'
import {
  IconDotsVertical,
  IconCopy,
  IconEdit,
  IconCode,
  IconShare,
  IconTrash,
} from '@tabler/icons-react'

// Tag color helper - generates consistent colors for tags
function getTagColorClasses(tag: string): string {
  const colorVariants = [
    'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 hover:bg-blue-500/25',
    'bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30 hover:bg-green-500/25',
    'bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-500/30 hover:bg-yellow-500/25',
    'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30 hover:bg-red-500/25',
    'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 hover:bg-purple-500/25',
    'bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/30 hover:bg-pink-500/25',
    'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30 hover:bg-orange-500/25',
    'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/25',
  ]
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colorVariants[Math.abs(hash) % colorVariants.length] ?? colorVariants[0]!
}

interface WebhookCardProps {
  webhook: {
    id: string
    uuid: string
    name: string
    tags?: string | null
  }
  webhookWorkerUrl: string
  isActive?: boolean
  isOwner?: boolean
}

export function WebhookCard({ webhook, webhookWorkerUrl, isActive = false, isOwner = true }: WebhookCardProps) {
  return (
    <div
      className={`border-b border-border last:border-b-0 transition-all ${
        isActive ? 'bg-background border-l-4 border-l-primary shadow-lg shadow-primary/20' : ''
      }`}
      data-webhook-id={webhook.id}
      data-webhook-name={webhook.name}
      data-webhook-tags={webhook.tags || ''}
      data-webhook-uuid={webhook.uuid}
    >
      <div className="p-4">
        {/* Mobile: Title + View + Kebab in ONE ROW */}
        <div className="min-[768px]:hidden flex items-center gap-2 mb-2">
          <h3 className="font-semibold text-base flex-1 min-w-0 truncate">{webhook.name}</h3>
          <a href={isActive ? '/dashboard' : `/dashboard/${webhook.id}`}>
            <Button
              color={isActive ? 'success' : 'primary'}
              style={isActive ? 'outline' : 'soft'}
              size="sm"
            >
              {isActive ? 'Viewing' : 'View'}
            </Button>
          </a>
          <Button
            className="flex-shrink-0"
            color="secondary"
            style="ghost"
            size="sm"
            data-action="toggle-menu"
            data-webhook-id={webhook.id}
            title="More actions"
            prefixIcon={IconDotsVertical}
          />
        </div>

        {/* Desktop: Title + Tags on left, Actions on right */}
        <div className="hidden min-[768px]:flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base lg:text-lg">{webhook.name}</h3>
            {webhook.tags && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {webhook.tags.split(',').map((tag, index) => {
                  const trimmedTag = tag.trim()
                  return trimmedTag ? (
                    <a
                      key={index}
                      href={`/dashboard?tag=${encodeURIComponent(trimmedTag)}`}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full font-medium transition-colors cursor-pointer border ${getTagColorClasses(trimmedTag)}`}
                    >
                      {trimmedTag}
                    </a>
                  ) : null
                })}
              </div>
            )}
          </div>

          {/* Desktop: All Actions */}
          <div className="flex-shrink-0 flex items-center gap-2">
            {isOwner && (
              <Button
                color="secondary"
                style="soft"
                size="sm"
                data-action="edit-webhook"
                data-webhook-id={webhook.id}
              >
                Edit
              </Button>
            )}
            <Button
              color="secondary"
              style="soft"
              size="sm"
              data-action="code-examples"
              data-webhook-id={webhook.id}
            >
              Code Examples
            </Button>
            {isOwner && (
              <Button
                color="secondary"
                style="soft"
                size="sm"
                data-action="share-webhook"
                data-webhook-id={webhook.id}
              >
                Share
              </Button>
            )}
            <a href={isActive ? '/dashboard' : `/dashboard/${webhook.id}`}>
              <Button
                color={isActive ? 'success' : 'primary'}
                style={isActive ? 'outline' : 'soft'}
                size="sm"
              >
                {isActive ? 'Viewing' : 'View Requests'}
              </Button>
            </a>
            {isOwner && (
              <Button
                color="error"
                style="soft"
                size="sm"
                data-action="delete-webhook"
                data-webhook-id={webhook.id}
              >
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* Mobile: Tags below title */}
        {webhook.tags && (
          <div className="min-[768px]:hidden mt-2 flex flex-wrap gap-1.5">
            {webhook.tags.split(',').map((tag, index) => {
              const trimmedTag = tag.trim()
              return trimmedTag ? (
                <a
                  key={index}
                  href={`/dashboard?tag=${encodeURIComponent(trimmedTag)}`}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full font-medium transition-colors cursor-pointer border ${getTagColorClasses(trimmedTag)}`}
                >
                  {trimmedTag}
                </a>
              ) : null
            })}
          </div>
        )}

        {/* Desktop: Full URL with Copy */}
        <div className="hidden min-[768px]:flex items-center gap-2 p-2">
            <span className="text-xs font-mono truncate flex-shrink-0" data-webhook-url>Url: </span>
          <code className="text-xs font-mono truncate flex-shrink-0" data-webhook-url>
            {webhookWorkerUrl}/w/{webhook.uuid}
          </code>
          <Button
            data-action="copy-webhook-url"
            data-webhook-id={webhook.id}
            className="flex-shrink-0"
            color="secondary"
            style="ghost"
            size="sm"
            title="Copy URL"
            prefixIcon={IconCopy}
          >
            Copy
          </Button>
        </div>

        {/* Mobile: Just Copy URL Button */}
        <div className="min-[768px]:hidden mt-3">
          <Button
            data-action="copy-webhook-url"
            data-webhook-id={webhook.id}
            className="w-full"
            color="secondary"
            style="soft"
            size="md"
            title="Copy webhook URL"
            prefixIcon={IconCopy}
          >
            Copy URL
          </Button>
        </div>

        {/* Mobile: Hidden Dropdown Menu */}
        <div className="hidden min-[768px]:hidden mt-3 border-t border-border pt-3" data-menu={webhook.id}>
          <div className="grid grid-cols-2 gap-2">
            {isOwner && (
              <Button
                color="secondary"
                style="soft"
                size="sm"
                data-action="edit-webhook"
                data-webhook-id={webhook.id}
                className="w-full"
                prefixIcon={IconEdit}
              >
                Edit
              </Button>
            )}
            <Button
              color="secondary"
              style="soft"
              size="sm"
              data-action="code-examples"
              data-webhook-id={webhook.id}
              className="w-full"
              prefixIcon={IconCode}
            >
              Code
            </Button>
            {isOwner && (
              <Button
                color="secondary"
                style="soft"
                size="sm"
                data-action="share-webhook"
                data-webhook-id={webhook.id}
                className="w-full"
                prefixIcon={IconShare}
              >
                Share
              </Button>
            )}
            {isOwner && (
              <Button
                color="error"
                style="soft"
                size="sm"
                data-action="delete-webhook"
                data-webhook-id={webhook.id}
                className="w-full"
                prefixIcon={IconTrash}
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Placeholder for requests container - will be populated by client-side JS */}
      <div className="hidden" data-requests-container={webhook.id}></div>
    </div>
  )
}
