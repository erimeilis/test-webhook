/**
 * Dashboard Handler (Refactored)
 * Main dashboard view after authentication
 */

import type { Context } from 'hono'
import type { Bindings, Variables } from '@/types/hono'
import { Button } from '@/components/ui/Button'
import { WebhookCard } from '@/components/WebhookCard'
import { Table, type TableColumn } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { ToggleSwitch } from '@/components/ui/ToggleSwitch'
import { AdminPanel, type UserStats } from '@/components/AdminPanel'
import { WebhookFilters } from '@/components/WebhookFilters'
import type { WebhookData as WebhookDataType } from '@/types/webhooks'
import { IconPlus, IconX } from '@tabler/icons-react'
import { getGravatarUrl } from '@/lib/utils/gravatar'

type AppContext = Context<{ Bindings: Bindings; Variables: Variables }>

export async function handleDashboard(c: AppContext) {
  const user = c.get('user')
  const isAdmin = c.get('isAdmin')
  const isImpersonating = c.get('isImpersonating')
  const services = c.get('services')

  if (!user) {
    return c.redirect('/login?error=unauthorized')
  }

  // Get webhook ID from URL params (optional)
  const webhookId = c.req.param('id')

  // Get active tag filter from query params (optional)
  const activeTag = c.req.query('tag')

  // Helper function to convert JSON tags to comma-separated string
  const formatTags = (tags: string | null): string | null => {
    if (!tags) return null
    try {
      const parsed = JSON.parse(tags)
      return Array.isArray(parsed) ? parsed.join(',') : tags
    } catch {
      return tags
    }
  }

  // Fetch user webhooks (owned + shared)
  const { owned: ownedWebhooks, shared: sharedWebhooksData } =
    await services.webhooks.getUserWebhooks(user.id, user.email)

  // Transform owned webhooks to format tags
  const userWebhooks = ownedWebhooks.map(w => ({
    ...w,
    tags: formatTags(w.tags)
  }))

  // Transform shared webhooks to match component interface
  const sharedWebhooks = sharedWebhooksData.map(s => ({
    shareId: s.webhook.id, // Using webhook id as shareId for now
    id: s.webhook.id,
    uuid: s.webhook.uuid,
    name: s.webhook.name,
    tags: formatTags(s.webhook.tags),
    role: s.role,
    invitedAt: s.invitedAt
  }))

  // Fetch admin stats if user is admin
  let allUsersStats: UserStats[] = []
  if (isAdmin) {
    try {
      const stats = await services.users.getAllUsersWithStats(user.id)
      // Cast to UserStats (UserWithStats is compatible, just missing index signature)
      allUsersStats = stats as unknown as UserStats[]
    } catch (error) {
      console.error('❌ Error fetching admin stats:', error)
      // Continue rendering without admin panel
    }
  }

  // Fetch webhook data if viewing specific webhook
  let selectedWebhook = null
  let requests: WebhookDataType[] = []
  let page = 1
  let pageSize = 10
  let totalRecords = 0
  let methodFilter: string | null = null

  if (webhookId) {
    // Verify access and get webhook
    const hasAccess = await services.webhooks.verifyAccess(webhookId, user.id)
    if (hasAccess) {
      selectedWebhook = userWebhooks.find(w => w.id === webhookId) ||
                        sharedWebhooksData.find(s => s.webhook.id === webhookId)?.webhook

      if (selectedWebhook) {
        try {
          // Parse query parameters for filtering, sorting, pagination
          const searchParams = new URL(c.req.url).searchParams
          page = Number(searchParams.get('requests_table_page') || '1')
          pageSize = Number(searchParams.get('requests_table_size') || '10')
          const sortColumn = searchParams.get('requests_table_sort') || 'received_at'
          const sortDirection = searchParams.get('requests_table_dir') || 'desc'
          const searchQuery = searchParams.get('requests_table_search') || ''
          methodFilter = searchParams.get('requests_table_method') || null
          const dateStart = searchParams.get('requests_table_date_start') || null
          const dateEnd = searchParams.get('requests_table_date_end') || null

          // Fetch webhook data using service
          const result = await services.webhookData.getWebhookData(webhookId, user.id, {
            page,
            pageSize,
            sortColumn: sortColumn as 'received_at' | 'method' | 'size_bytes',
            sortDirection: sortDirection as 'asc' | 'desc',
            search: searchQuery || undefined,
            method: methodFilter === 'GET' || methodFilter === 'POST' ? methodFilter : undefined,
            dateStart: dateStart || undefined,
            dateEnd: dateEnd || undefined
          })

          requests = result.data.map(r => ({
            id: r.id,
            webhook_id: r.webhookId,
            method: r.method as 'GET' | 'POST',
            headers: r.headers,
            data: r.data,
            size_bytes: r.sizeBytes,
            received_at: typeof r.receivedAt === 'number' ? r.receivedAt : Math.floor(r.receivedAt.getTime() / 1000)
          }))
          totalRecords = result.total
        } catch (error) {
          console.error('❌ Error fetching webhook data:', error)
        }
      }
    }
  }

  // Parse user tags from all webhooks
  const allTags = new Set<string>()
  userWebhooks.forEach(webhook => {
    if (webhook.tags) {
      try {
        const tags = JSON.parse(webhook.tags)
        if (Array.isArray(tags)) {
          tags.forEach(tag => allTags.add(tag))
        }
      } catch {
        // Ignore invalid JSON
      }
    }
  })

  // Note: Tag filtering is handled client-side via JavaScript (see client.js)
  // Server just passes activeTag for UI state, no server-side filtering needed

  // Generate gravatar URL
  const gravatarUrl = getGravatarUrl(user.email)

  // Get webhook worker URL
  const webhookWorkerUrl = c.env.WEBHOOK_WORKER_URL || 'http://localhost:5174'

  // Table columns configuration
  // Order: Datetime (desktop only), Headers (with mobile datetime), Payload, Method (desktop only), Size (desktop only)
  const columns: TableColumn<WebhookDataType>[] = [
    {
      key: 'received_at',
      label: 'Datetime',
      sortable: true,
      className: 'whitespace-nowrap max-md:hidden',
      render: (value) => {
        const date = new Date((value as number) * 1000)
        const monthShort = date.toLocaleDateString('en-US', { month: 'short' })
        const day = date.getDate()
        const year = date.getFullYear()
        const weekday = date.toLocaleDateString('en-US', { weekday: 'short' })
        const time = date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })

        return (
          <div className="text-xs leading-tight">
            <div className="font-medium">{monthShort} {day}, {year}</div>
            <div className="text-muted-foreground">{weekday}, {time}</div>
          </div>
        )
      }
    },
    {
      key: 'headers',
      label: 'Headers',
      render: (value, row) => {
        // Parse headers
        let headerCount = 0
        let displayText = '-'
        try {
          const headers = JSON.parse(String(value))
          headerCount = Object.keys(headers).length
          const preview = Object.entries(headers)
            .slice(0, 2)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ')
          displayText = preview.length > 40 ? preview.substring(0, 40) + '...' : preview
        } catch {
          // Invalid JSON
        }

        // Format datetime for mobile
        const date = new Date((row.received_at as number) * 1000)
        const monthShort = date.toLocaleDateString('en-US', { month: 'short' })
        const day = date.getDate()
        const year = date.getFullYear()
        const time = date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })

        return (
          <div className="text-xs">
            {/* Desktop: Headers only */}
            <div
              className="max-md:hidden font-mono cursor-pointer hover:text-primary transition-colors"
              data-headers={String(value)}
              title="Click to view all headers"
            >
              <div className="text-muted-foreground">
                {headerCount} header{headerCount !== 1 ? 's' : ''}
              </div>
              <div className="text-foreground truncate max-w-48">{displayText}</div>
            </div>
            {/* Mobile: Headers and Datetime on same row, preview below */}
            <div className="md:hidden">
              <div className="flex justify-between items-start gap-4 mb-1">
                <div
                  className="text-muted-foreground font-mono cursor-pointer hover:text-primary transition-colors"
                  data-headers={String(value)}
                  title="Click to view all headers"
                >
                  {headerCount} header{headerCount !== 1 ? 's' : ''}
                </div>
                <div className="whitespace-nowrap text-right flex-shrink-0">
                  <span className="font-medium">{monthShort} {day}, {year}</span>
                  <span className="text-muted-foreground"> · {time}</span>
                </div>
              </div>
              <div className="text-foreground font-mono truncate">
                {displayText}
              </div>
            </div>
          </div>
        )
      }
    },
    {
      key: 'data',
      label: 'Payload',
      render: (value) => {
        const stringValue = String(value)
        const displayText = stringValue.length > 80 ? stringValue.substring(0, 80) + '...' : stringValue

        return (
          <div
            className="text-xs font-mono cursor-pointer hover:text-primary transition-colors break-all"
            data-payload={stringValue}
            title="Click to view full payload"
          >
            {displayText}
          </div>
        )
      }
    },
    {
      key: 'method',
      label: 'Method',
      sortable: true,
      className: 'whitespace-nowrap max-md:hidden',
      render: (value) => (
        <Badge
          variant={value === 'POST' ? 'default' : 'secondary'}
          size="sm"
        >
          {String(value)}
        </Badge>
      )
    },
    {
      key: 'size_bytes',
      label: 'Size',
      sortable: true,
      className: 'whitespace-nowrap max-md:hidden',
      render: (value) => {
        const bytes = value as number
        if (bytes < 1024) return <span className="text-xs whitespace-nowrap">{bytes} B</span>
        if (bytes < 1024 * 1024) return <span className="text-xs whitespace-nowrap">{(bytes / 1024).toFixed(1)} KB</span>
        return <span className="text-xs whitespace-nowrap">{(bytes / 1024 / 1024).toFixed(2)} MB</span>
      }
    }
  ]

  // Render component (JSX)
  return c.render(
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm transition-all" data-header>
        <div className="container mx-auto px-4 py-3 max-w-7xl transition-all" data-header-content>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                <path d="M16 9v6a5 5 0 0 1 -10 0v-4l3 3"/>
                <path d="M16 7m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/>
                <path d="M16 5v-2"/>
              </svg>
              <h1 className="text-lg min-[768px]:text-xl font-bold whitespace-nowrap">Webhooks</h1>
            </div>

            {/* Desktop: Email + Sign Out / Return to Admin */}
            <div className="hidden min-[768px]:flex items-center gap-3">
              <div className="flex items-center gap-2">
                <img src={gravatarUrl} alt="Avatar" className="w-8 h-8 rounded-full" />
                <div className="flex flex-col">
                  {isImpersonating && (
                    <span className="text-xs text-amber-400 font-medium">Impersonating</span>
                  )}
                  <span className="text-sm text-muted-foreground">{user.email}</span>
                </div>
              </div>
              <Button
                data-action={isImpersonating ? "stop-impersonation" : "sign-out"}
                color="secondary"
                style="outline"
                size="sm"
              >
                {isImpersonating ? "Return to Admin" : "Sign Out"}
              </Button>
            </div>

            {/* Mobile: Gravatar with Dropdown */}
            <div className="min-[768px]:hidden relative">
              <button
                className="w-10 h-10 rounded-full overflow-hidden hover:ring-2 hover:ring-primary transition-all"
                data-action="toggle-user-menu"
                title="User menu"
              >
                <img src={gravatarUrl} alt="Avatar" className="w-full h-full pointer-events-none" />
              </button>

              {/* Dropdown Menu */}
              <div className="hidden absolute right-0 mt-2 w-64 bg-card border border-border rounded-lg shadow-lg p-3" data-user-menu>
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border">
                  <img src={gravatarUrl} alt="Avatar" className="w-10 h-10 rounded-full" />
                  <div className="flex flex-col flex-1 min-w-0">
                    {isImpersonating && (
                      <span className="text-xs text-amber-400 font-medium">Impersonating</span>
                    )}
                    <span className="text-sm text-muted-foreground truncate">{user.email}</span>
                  </div>
                </div>
                <Button
                  color="secondary"
                  style="outline"
                  size="sm"
                  data-action={isImpersonating ? "stop-impersonation" : "sign-out"}
                  className="w-full"
                >
                  {isImpersonating ? "Return to Admin" : "Sign Out"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Slot-based Layout */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div id="dashboard-main-grid" className="grid gap-6 w-full overflow-x-hidden">
          {/* Admin Panel Section (admin only) */}
          {isAdmin && allUsersStats.length > 0 && (
            <AdminPanel users={allUsersStats} />
          )}

          {/* Filter Panel */}
          {activeTag && <WebhookFilters activeTag={activeTag} />}

          {/* Shared Webhooks Section */}
          {sharedWebhooks.length > 0 && (
            <div className="bg-card border border-warning rounded-lg">
              <div className="px-4 py-3 border-b border-warning/30 bg-warning/5">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#3b82f6' }}>
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  Shared With You
                  <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                    ({sharedWebhooks.length})
                  </span>
                </h2>
              </div>
              <div>
                {sharedWebhooks.map((shared) => (
                  <WebhookCard
                    key={shared.shareId}
                    webhook={{
                      id: shared.id || '',
                      uuid: shared.uuid || '',
                      name: shared.name || 'Unnamed Webhook',
                      tags: shared.tags
                    }}
                    webhookWorkerUrl={webhookWorkerUrl}
                    isActive={shared.id === webhookId}
                    isOwner={false}
                  />
                ))}
              </div>
            </div>
          )}

          {/* TOP SLOT: Webhooks List */}
          <div className="bg-card border border-border rounded-lg">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                <span className="hidden min-[768px]:inline">Your Webhooks</span>
                <span className="min-[768px]:hidden">Webhooks</span>
                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                  ({userWebhooks.length})
                </span>
              </h2>

              {/* Desktop: Full Button */}
              <Button
                color="primary"
                size="sm"
                data-action="create-webhook"
                className="hidden min-[768px]:inline-flex"
              >
                + Create Webhook
              </Button>

              {/* Mobile: Round Plus Button */}
              <Button
                className="min-[768px]:hidden"
                color="primary"
                size="sm"
                modifier="square"
                data-action="create-webhook"
                title="Create webhook"
                prefixIcon={IconPlus}
              />
            </div>
            <div data-webhooks-list>
              {userWebhooks.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  No webhooks yet. Create your first webhook to get started.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {userWebhooks.map((webhook) => (
                    <WebhookCard
                      key={webhook.id}
                      webhook={webhook}
                      webhookWorkerUrl={webhookWorkerUrl}
                      isActive={webhook.id === webhookId}
                      isOwner={true}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* BOTTOM SLOT: Requests Table (only shown when webhook is selected) */}
          {selectedWebhook && (
            <div className="bg-card border border-border rounded-lg" id="requests-section">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Webhook Requests</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Showing recent requests for <strong>{selectedWebhook.name}</strong>
                  </p>
                </div>
                <a
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <IconX size={16} />
                  Close
                </a>
              </div>
              <div className="p-4 min-[768px]:p-6">
                <Table
                  columns={columns}
                  data={requests}
                  currentPage={page}
                  defaultPageSize={pageSize}
                  totalRecords={totalRecords}
                  tableId="requests_table"
                  filters={
                    <>
                      {/* Date Range Filter */}
                      <div className="relative">
                        <button className="px-3 py-1.5 text-sm bg-background border border-border rounded-lg hover:bg-muted transition-colors">
                          Date Range
                        </button>
                        <div
                          className="absolute top-full left-0 mt-2 w-64 bg-popover border border-border rounded-lg shadow-lg z-50 hidden"
                          data-filter-dropdown="date-range"
                        >
                          <div className="p-3 space-y-3">
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Start Date</label>
                              <input
                                type="date"
                                data-filter-date-start
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">End Date</label>
                              <input
                                type="date"
                                data-filter-date-end
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                              />
                            </div>
                          </div>
                          <div className="border-t border-border p-2 flex gap-2">
                            <button
                              data-filter-clear="date-range"
                              className="flex-1 px-3 py-1.5 text-sm bg-background hover:bg-muted rounded transition-colors"
                            >
                              Clear
                            </button>
                            <button
                              data-filter-apply="date-range"
                              className="flex-1 px-3 py-1.5 text-sm bg-primary text-primary-foreground hover:opacity-90 rounded transition-colors"
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Method Filter */}
                      <ToggleSwitch
                        options={[
                          { value: 'all', label: 'All' },
                          { value: 'GET', label: 'GET' },
                          { value: 'POST', label: 'POST' },
                        ]}
                        defaultValue={methodFilter || 'all'}
                        dataAttribute="method-filter"
                        color="primary"
                        style="soft"
                      />
                    </>
                  }
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
