/**
 * Dashboard Handlers
 * Main dashboard view after authentication
 */

import type { Context } from 'hono'
import type { Bindings, Variables } from '@/types/hono'
import { Button } from '@/components/ui/Button'
import { WebhookCard } from '@/components/WebhookCard'
import { Table, type TableColumn } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { drizzle } from 'drizzle-orm/d1'
import { webhooks, webhookData, webhookShares } from '@/lib/db-schema'
import { eq, desc, or } from 'drizzle-orm'
import type { WebhookData } from '@/types/webhooks'
import { IconPlus, IconX } from '@tabler/icons-react'

type AppContext = Context<{ Bindings: Bindings; Variables: Variables }>

// Simple MD5 implementation for Gravatar
function md5(str: string): string {
  function rotateLeft(n: number, s: number) {
    return (n << s) | (n >>> (32 - s))
  }

  function addUnsigned(x: number, y: number) {
    const lsw = (x & 0xFFFF) + (y & 0xFFFF)
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16)
    return (msw << 16) | (lsw & 0xFFFF)
  }

  function f(x: number, y: number, z: number) { return (x & y) | ((~x) & z) }
  function g(x: number, y: number, z: number) { return (x & z) | (y & (~z)) }
  function h(x: number, y: number, z: number) { return x ^ y ^ z }
  function i(x: number, y: number, z: number) { return y ^ (x | (~z)) }

  function ff(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(f(b, c, d), x), ac))
    return addUnsigned(rotateLeft(a, s), b)
  }

  function gg(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(g(b, c, d), x), ac))
    return addUnsigned(rotateLeft(a, s), b)
  }

  function hh(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(h(b, c, d), x), ac))
    return addUnsigned(rotateLeft(a, s), b)
  }

  function ii(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(i(b, c, d), x), ac))
    return addUnsigned(rotateLeft(a, s), b)
  }

  function convertToWordArray(str: string) {
    const lWordCount = (((str.length + 8) - ((str.length + 8) % 64)) / 64 + 1) * 16
    const lWordArray = new Array(lWordCount - 1)
    let lBytePosition = 0
    let lByteCount = 0

    while (lByteCount < str.length) {
      const lWordIndex = (lByteCount - (lByteCount % 4)) / 4
      lBytePosition = (lByteCount % 4) * 8
      lWordArray[lWordIndex] = (lWordArray[lWordIndex] || 0) | (str.charCodeAt(lByteCount) << lBytePosition)
      lByteCount++
    }

    const lWordIndex = (lByteCount - (lByteCount % 4)) / 4
    lBytePosition = (lByteCount % 4) * 8
    lWordArray[lWordIndex] = lWordArray[lWordIndex] | (0x80 << lBytePosition)
    lWordArray[lWordCount - 2] = str.length * 8
    return lWordArray
  }

  function wordToHex(n: number) {
    let hex = ''
    for (let i = 0; i <= 3; i++) {
      const byte = (n >>> (i * 8)) & 255
      hex += ('0' + byte.toString(16)).slice(-2)
    }
    return hex
  }

  const x = convertToWordArray(str)
  let a = 0x67452301
  let b = 0xEFCDAB89
  let c = 0x98BADCFE
  let d = 0x10325476

  for (let k = 0; k < x.length; k += 16) {
    const AA = a, BB = b, CC = c, DD = d

    a = ff(a, b, c, d, x[k + 0],  7, 0xD76AA478)
    d = ff(d, a, b, c, x[k + 1],  12, 0xE8C7B756)
    c = ff(c, d, a, b, x[k + 2],  17, 0x242070DB)
    b = ff(b, c, d, a, x[k + 3],  22, 0xC1BDCEEE)
    a = ff(a, b, c, d, x[k + 4],  7, 0xF57C0FAF)
    d = ff(d, a, b, c, x[k + 5],  12, 0x4787C62A)
    c = ff(c, d, a, b, x[k + 6],  17, 0xA8304613)
    b = ff(b, c, d, a, x[k + 7],  22, 0xFD469501)
    a = ff(a, b, c, d, x[k + 8],  7, 0x698098D8)
    d = ff(d, a, b, c, x[k + 9],  12, 0x8B44F7AF)
    c = ff(c, d, a, b, x[k + 10], 17, 0xFFFF5BB1)
    b = ff(b, c, d, a, x[k + 11], 22, 0x895CD7BE)
    a = ff(a, b, c, d, x[k + 12], 7, 0x6B901122)
    d = ff(d, a, b, c, x[k + 13], 12, 0xFD987193)
    c = ff(c, d, a, b, x[k + 14], 17, 0xA679438E)
    b = ff(b, c, d, a, x[k + 15], 22, 0x49B40821)

    a = gg(a, b, c, d, x[k + 1],  5, 0xF61E2562)
    d = gg(d, a, b, c, x[k + 6],  9, 0xC040B340)
    c = gg(c, d, a, b, x[k + 11], 14, 0x265E5A51)
    b = gg(b, c, d, a, x[k + 0],  20, 0xE9B6C7AA)
    a = gg(a, b, c, d, x[k + 5],  5, 0xD62F105D)
    d = gg(d, a, b, c, x[k + 10], 9, 0x02441453)
    c = gg(c, d, a, b, x[k + 15], 14, 0xD8A1E681)
    b = gg(b, c, d, a, x[k + 4],  20, 0xE7D3FBC8)
    a = gg(a, b, c, d, x[k + 9],  5, 0x21E1CDE6)
    d = gg(d, a, b, c, x[k + 14], 9, 0xC33707D6)
    c = gg(c, d, a, b, x[k + 3],  14, 0xF4D50D87)
    b = gg(b, c, d, a, x[k + 8],  20, 0x455A14ED)
    a = gg(a, b, c, d, x[k + 13], 5, 0xA9E3E905)
    d = gg(d, a, b, c, x[k + 2],  9, 0xFCEFA3F8)
    c = gg(c, d, a, b, x[k + 7],  14, 0x676F02D9)
    b = gg(b, c, d, a, x[k + 12], 20, 0x8D2A4C8A)

    a = hh(a, b, c, d, x[k + 5],  4, 0xFFFA3942)
    d = hh(d, a, b, c, x[k + 8],  11, 0x8771F681)
    c = hh(c, d, a, b, x[k + 11], 16, 0x6D9D6122)
    b = hh(b, c, d, a, x[k + 14], 23, 0xFDE5380C)
    a = hh(a, b, c, d, x[k + 1],  4, 0xA4BEEA44)
    d = hh(d, a, b, c, x[k + 4],  11, 0x4BDECFA9)
    c = hh(c, d, a, b, x[k + 7],  16, 0xF6BB4B60)
    b = hh(b, c, d, a, x[k + 10], 23, 0xBEBFBC70)
    a = hh(a, b, c, d, x[k + 13], 4, 0x289B7EC6)
    d = hh(d, a, b, c, x[k + 0],  11, 0xEAA127FA)
    c = hh(c, d, a, b, x[k + 3],  16, 0xD4EF3085)
    b = hh(b, c, d, a, x[k + 6],  23, 0x04881D05)
    a = hh(a, b, c, d, x[k + 9],  4, 0xD9D4D039)
    d = hh(d, a, b, c, x[k + 12], 11, 0xE6DB99E5)
    c = hh(c, d, a, b, x[k + 15], 16, 0x1FA27CF8)
    b = hh(b, c, d, a, x[k + 2],  23, 0xC4AC5665)

    a = ii(a, b, c, d, x[k + 0],  6, 0xF4292244)
    d = ii(d, a, b, c, x[k + 7],  10, 0x432AFF97)
    c = ii(c, d, a, b, x[k + 14], 15, 0xAB9423A7)
    b = ii(b, c, d, a, x[k + 5],  21, 0xFC93A039)
    a = ii(a, b, c, d, x[k + 12], 6, 0x655B59C3)
    d = ii(d, a, b, c, x[k + 3],  10, 0x8F0CCC92)
    c = ii(c, d, a, b, x[k + 10], 15, 0xFFEFF47D)
    b = ii(b, c, d, a, x[k + 1],  21, 0x85845DD1)
    a = ii(a, b, c, d, x[k + 8],  6, 0x6FA87E4F)
    d = ii(d, a, b, c, x[k + 15], 10, 0xFE2CE6E0)
    c = ii(c, d, a, b, x[k + 6],  15, 0xA3014314)
    b = ii(b, c, d, a, x[k + 13], 21, 0x4E0811A1)
    a = ii(a, b, c, d, x[k + 4],  6, 0xF7537E82)
    d = ii(d, a, b, c, x[k + 11], 10, 0xBD3AF235)
    c = ii(c, d, a, b, x[k + 2],  15, 0x2AD7D2BB)
    b = ii(b, c, d, a, x[k + 9],  21, 0xEB86D391)

    a = addUnsigned(a, AA)
    b = addUnsigned(b, BB)
    c = addUnsigned(c, CC)
    d = addUnsigned(d, DD)
  }

  return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase()
}

// Helper to generate Gravatar URL
function getGravatarUrl(email: string | undefined): string {
  if (!email) {
    return 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&s=32'
  }

  const hash = md5(email.toLowerCase().trim())
  return `https://www.gravatar.com/avatar/${hash}?d=mp&s=32`
}

// Dashboard page - protected route
export async function handleDashboard(c: AppContext) {
  const user = c.get('user')

  if (!user) {
    return c.redirect('/login?error=unauthorized')
  }

  // Get webhook ID from URL params (optional)
  const webhookId = c.req.param('id')

  // Fetch webhooks for the user
  const db = drizzle(c.env.DB)
  const userWebhooks = await db
    .select()
    .from(webhooks)
    .where(eq(webhooks.userId, user.id))
    .orderBy(webhooks.createdAt)
    .all()

  // Fetch shared webhooks for this user
  const sharedWebhooks = await db
    .select({
      shareId: webhookShares.id,
      id: webhooks.id,
      uuid: webhooks.uuid,
      name: webhooks.name,
      tags: webhooks.tags,
      role: webhookShares.role,
      invitedAt: webhookShares.invitedAt,
    })
    .from(webhookShares)
    .leftJoin(webhooks, eq(webhookShares.webhookId, webhooks.id))
    .where(
      or(
        eq(webhookShares.sharedWithEmail, user.email.toLowerCase()),
        eq(webhookShares.sharedWithUserId, user.id)
      )
    )
    .all()

  // Fetch requests if viewing specific webhook
  let selectedWebhook = null
  let requests: WebhookData[] = []

  if (webhookId) {
    // Verify webhook belongs to user OR is shared with them
    selectedWebhook = userWebhooks.find(w => w.id === webhookId)

    // If not owned, check if it's shared with the user
    if (!selectedWebhook) {
      const sharedWebhook = await db
        .select()
        .from(webhooks)
        .where(eq(webhooks.id, webhookId))
        .get()

      if (sharedWebhook) {
        const hasAccess = sharedWebhooks.some(sw => sw.id === webhookId)
        if (hasAccess) {
          selectedWebhook = sharedWebhook
        }
      }
    }

    if (selectedWebhook) {
      try {
        const dbRequests = await db
          .select()
          .from(webhookData)
          .where(eq(webhookData.webhookId, webhookId))
          .orderBy(desc(webhookData.receivedAt))
          .limit(100)
          .all()

        console.log('📊 Fetched requests:', dbRequests.length, 'Sample:', dbRequests[0])

        // Transform DB records to match WebhookData interface
        requests = dbRequests.map(req => {
          // Handle receivedAt which could be Date or number
          let timestamp: number
          if (req.receivedAt instanceof Date) {
            timestamp = Math.floor(req.receivedAt.getTime() / 1000)
          } else if (typeof req.receivedAt === 'number') {
            // Already a timestamp
            timestamp = req.receivedAt
          } else {
            // Fallback to current time
            console.warn('Invalid receivedAt format:', req.receivedAt)
            timestamp = Math.floor(Date.now() / 1000)
          }

          return {
            id: req.id,
            webhook_id: req.webhookId,
            method: req.method as 'GET' | 'POST',
            headers: req.headers,
            data: req.data,
            size_bytes: req.sizeBytes,
            received_at: timestamp
          }
        })

        console.log('✅ Transformed requests:', requests.length)
      } catch (error) {
        console.error('❌ Error fetching webhook requests:', error)
        // Continue rendering with empty requests array
      }
    }
  }

  const gravatarUrl = getGravatarUrl(user.email)
  const webhookWorkerUrl = c.env.WEBHOOK_WORKER_URL || 'http://localhost:5174'

  // Table columns configuration
  // Order: Datetime, Headers, Payload, Method, Size
  const requestsColumns: TableColumn<WebhookData>[] = [
    {
      key: 'received_at',
      label: 'Datetime',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (value) => {
        const date = new Date((value as number) * 1000)

        // Format date parts
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
          <div className="text-xs leading-tight whitespace-nowrap">
            <div className="font-medium">{monthShort} {day}, {year}</div>
            <div className="text-muted-foreground">{weekday}, {time}</div>
          </div>
        )
      }
    },
    {
      key: 'headers',
      label: 'Headers',
      className: 'whitespace-nowrap',
      render: (value) => {
        try {
          const headers = JSON.parse(String(value))
          const headerCount = Object.keys(headers).length
          const preview = Object.entries(headers)
            .slice(0, 2)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ')
          const displayText = preview.length > 40 ? preview.substring(0, 40) + '...' : preview

          return (
            <div
              className="text-xs font-mono cursor-pointer hover:text-primary transition-colors"
              data-headers={String(value)}
              title="Click to view all headers"
            >
              <div className="text-muted-foreground">
                {headerCount} header{headerCount !== 1 ? 's' : ''}
              </div>
              <div className="text-foreground truncate max-w-48">{displayText}</div>
            </div>
          )
        } catch {
          return <span className="text-xs text-muted-foreground">-</span>
        }
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
            className="text-xs font-mono cursor-pointer hover:text-primary transition-colors truncate max-w-xl"
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

  return c.render(
    <div className="min-h-screen bg-background">
      {/* Header - Sticky with compact mode on scroll */}
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

            {/* Desktop: Email + Sign Out */}
            <div className="hidden min-[768px]:flex items-center gap-3">
                <div className="flex items-center gap-2">
                    <img src={gravatarUrl} alt="Avatar" className="w-8 h-8 rounded-full" />
                    <span className="text-sm text-muted-foreground">{user.email}</span>
                </div>
                <Button color="secondary" style="outline" size="sm" data-action="sign-out">
                  Sign Out
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
                        <span className="text-sm text-muted-foreground truncate flex-1">{user.email}</span>
                    </div>
                    <Button color="secondary" style="outline" size="sm" data-action="sign-out" className="w-full">
                      Sign Out
                    </Button>
                </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Slot-based Layout */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div id="dashboard-main-grid" className="grid gap-6 w-full overflow-x-hidden">
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
                  data={requests}
                  columns={requestsColumns}
                  searchable={true}
                  searchPlaceholder="Search requests by method, data, or timestamp..."
                  emptyMessage="No requests received yet. Send a request to this webhook to see it appear here."
                  tableId="requests-table"
                  defaultPageSize={10}
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
