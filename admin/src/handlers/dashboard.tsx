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
import type { WebhookData as WebhookDataType } from '@/types/webhooks'
import { IconPlus, IconX } from '@tabler/icons-react'
import { getGravatarUrl } from '@/lib/utils/gravatar'
import { formatBytes, formatDateTime } from '@/lib/utils/formatting'

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

  // Fetch user webhooks (owned + shared)
  const { owned: userWebhooks, shared: sharedWebhooksData } =
    await services.webhooks.getUserWebhooks(user.id, user.email)

  // Transform shared webhooks to match component interface
  const sharedWebhooks = sharedWebhooksData.map(s => ({
    shareId: s.webhook.id, // Using webhook id as shareId for now
    id: s.webhook.id,
    uuid: s.webhook.uuid,
    name: s.webhook.name,
    tags: s.webhook.tags,
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

  // Filter webhooks by active tag
  let filteredWebhooks = userWebhooks
  if (activeTag && activeTag !== 'all') {
    filteredWebhooks = userWebhooks.filter(webhook => {
      if (!webhook.tags) return false
      try {
        const tags = JSON.parse(webhook.tags)
        return Array.isArray(tags) && tags.includes(activeTag)
      } catch {
        return false
      }
    })
  }

  // Generate gravatar URL
  const gravatarUrl = getGravatarUrl(user.email)

  // Get webhook worker URL
  const webhookWorkerUrl = c.env.WEBHOOK_WORKER_URL || 'http://localhost:5174'

  // Table columns for webhook data
  const columns: TableColumn<WebhookDataType>[] = [
    {
      key: 'method',
      label: 'Method',
      sortable: true,
      render: (_value, row) => <Badge>{row.method}</Badge>
    },
    {
      key: 'data',
      label: 'Request Data',
      sortable: false,
      render: (_value, row) => {
        try {
          const data = JSON.parse(row.data)
          const preview = JSON.stringify(data).substring(0, 100)
          return <span className="font-mono text-xs">{preview}...</span>
        } catch {
          return <span className="text-muted-foreground">Invalid JSON</span>
        }
      }
    },
    {
      key: 'size_bytes',
      label: 'Size',
      sortable: true,
      render: (_value, row) => formatBytes(row.size_bytes)
    },
    {
      key: 'received_at',
      label: 'Received',
      sortable: true,
      render: (_value, row) => formatDateTime(row.received_at)
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      render: (_value, row) => (
        <a
          href={`/webhooks/${webhookId}/requests/${row.id}`}
          className="text-primary hover:underline text-sm"
        >
          View
        </a>
      )
    }
  ]

  // Render component (JSX)
  return c.render(
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="font-bold text-xl">
              Webhook Dashboard
            </a>
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && <span className="text-xs text-muted-foreground">Admin</span>}
            {isImpersonating && (
              <form method="POST" action="/admin/stop-impersonation" className="inline">
                <Button type="submit" style="outline" size="sm">
                  Stop Impersonation
                </Button>
              </form>
            )}
            <div className="flex items-center gap-3">
              <img src={gravatarUrl} alt={user.name || user.email} className="w-8 h-8 rounded-full" />
              <div className="text-sm">
                <div className="font-medium">{user.name || user.email}</div>
                <div className="text-muted-foreground text-xs">{user.email}</div>
              </div>
            </div>
            <form method="POST" action="/api/auth/sign-out" className="inline">
              <Button type="submit" style="ghost" size="sm">
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-screen-2xl py-6">
        {/* Admin Panel */}
        {isAdmin && allUsersStats.length > 0 && (
          <div className="mb-6">
            <AdminPanel users={allUsersStats} />
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-[320px_1fr]">
          {/* Sidebar: Webhooks List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Your Webhooks</h2>
              <a href="/webhooks/create">
                <Button size="sm">
                  <IconPlus className="w-4 h-4 mr-1" />
                  New
                </Button>
              </a>
            </div>

            {/* Tag Filter */}
            {allTags.size > 0 && (
              <div className="flex flex-wrap gap-2">
                <Badge
                  className="cursor-pointer"
                  onClick={() => { window.location.href = '/dashboard' }}
                >
                  All
                </Badge>
                {Array.from(allTags).map(tag => (
                  <Badge
                    key={tag}
                    className="cursor-pointer"
                    onClick={() => { window.location.href = `/dashboard?tag=${encodeURIComponent(tag)}` }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Owned Webhooks */}
            {filteredWebhooks.length === 0 && sharedWebhooks.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No webhooks yet</p>
                <a href="/webhooks/create" className="text-primary hover:underline">
                  Create your first webhook
                </a>
              </div>
            )}

            {filteredWebhooks.map(webhook => (
              <WebhookCard
                key={webhook.id}
                webhook={webhook}
                webhookWorkerUrl={webhookWorkerUrl}
                isActive={webhookId === webhook.id}
                isOwner={true}
              />
            ))}

            {/* Shared Webhooks */}
            {sharedWebhooks.length > 0 && (
              <>
                <div className="border-t border-border pt-4 mt-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Shared with you</h3>
                </div>
                {sharedWebhooks.map(shared => {
                  const webhook = {
                    id: shared.id,
                    uuid: shared.uuid,
                    name: shared.name,
                    tags: shared.tags
                  }
                  return (
                    <WebhookCard
                      key={shared.id}
                      webhook={webhook}
                      webhookWorkerUrl={webhookWorkerUrl}
                      isActive={webhookId === shared.id}
                      isOwner={false}
                    />
                  )
                })}
              </>
            )}
          </div>

          {/* Main Area: Webhook Details */}
          {selectedWebhook && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{selectedWebhook.name}</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    {totalRecords} request{totalRecords !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <a href={`/webhooks/${webhookId}/edit`}>
                    <Button style="outline" size="sm">Edit</Button>
                  </a>
                  <form
                    method="POST"
                    action={`/webhooks/${webhookId}/delete`}
                    onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                      if (!confirm('Delete this webhook and all its data?')) {
                        e.preventDefault()
                      }
                    }}
                  >
                    <Button type="submit" color="error" size="sm">
                      <IconX className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </div>

              {/* Webhook Data Table */}
              <div className="rounded-lg border border-border bg-card">
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
