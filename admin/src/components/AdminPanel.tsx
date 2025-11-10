/**
 * AdminPanel Component
 * Shows all users with statistics and impersonation controls
 */

import { Table, type TableColumn } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { IconUserCircle } from '@tabler/icons-react'

export interface UserStats extends Record<string, unknown> {
  id: string
  email: string
  name: string | null
  role: string | null
  emailVerified: boolean
  createdAt: Date
  webhookCount: number
  requestCount: number
  totalBytes: number
}

interface AdminPanelProps {
  users: UserStats[]
}

export function AdminPanel({ users }: AdminPanelProps) {
  // Table columns configuration
  const usersColumns: TableColumn<UserStats>[] = [
    {
      key: 'email',
      label: 'User',
      render: (value, row) => (
        <div className="text-sm">
          <div className="font-medium">{value as string}</div>
          {row.name && (
            <div className="text-xs text-muted-foreground">{row.name}</div>
          )}
        </div>
      )
    },
    {
      key: 'role',
      label: 'Role',
      className: 'text-center',
      render: (value) => (
        <Badge
          variant={value === 'admin' ? 'error' : 'default'}
          size="sm"
        >
          {(value as string) || 'user'}
        </Badge>
      )
    },
    {
      key: 'emailVerified',
      label: 'Verified',
      className: 'text-center max-md:hidden',
      render: (value) => (
        <Badge
          variant={value ? 'default' : 'secondary'}
          size="sm"
        >
          {value ? '✓ Yes' : '✗ No'}
        </Badge>
      )
    },
    {
      key: 'webhookCount',
      label: 'Webhooks',
      sortable: true,
      className: 'text-center',
      render: (value) => (
        <span className="text-sm font-medium">{value as number}</span>
      )
    },
    {
      key: 'requestCount',
      label: 'Requests',
      sortable: true,
      className: 'text-center max-md:hidden',
      render: (value) => (
        <span className="text-sm">{(value as number).toLocaleString()}</span>
      )
    },
    {
      key: 'totalBytes',
      label: 'Storage',
      sortable: true,
      className: 'text-center max-md:hidden',
      render: (value) => {
        const bytes = value as number
        if (bytes < 1024) return <span className="text-sm">{bytes} B</span>
        if (bytes < 1024 * 1024) return <span className="text-sm">{(bytes / 1024).toFixed(1)} KB</span>
        return <span className="text-sm">{(bytes / 1024 / 1024).toFixed(2)} MB</span>
      }
    },
    {
      key: 'createdAt',
      label: 'Joined',
      sortable: true,
      className: 'text-center max-md:hidden',
      render: (value) => {
        const date = new Date(value as Date)
        const monthShort = date.toLocaleDateString('en-US', { month: 'short' })
        const day = date.getDate()
        const year = date.getFullYear()

        return (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {monthShort} {day}, {year}
          </span>
        )
      }
    },
    {
      key: 'id',
      label: 'Actions',
      className: 'text-center',
      render: (value, row) => (
        <Button
          color="secondary"
          style="outline"
          size="sm"
          prefixIcon={IconUserCircle}
          data-action="impersonate-user"
          data-user-id={value as string}
          data-user-email={row.email}
          title={`Impersonate ${row.email}`}
          disabled={row.role === 'admin'}
        >
          <span className="max-md:hidden">Impersonate</span>
        </Button>
      )
    }
  ]

  return (
    <div id="admin-panel" className="bg-card border border-primary/30 rounded-lg">
      <div className="px-4 py-3 border-b border-primary/30 bg-primary/5 flex items-center justify-between">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span className="hidden min-[768px]:inline">System Administration</span>
          <span className="min-[768px]:hidden">Admin</span>
          <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
            ({users.length})
          </span>
        </h2>
        <Badge variant="error" size="sm">
          Admin Only
        </Badge>
      </div>

      {/* Desktop: Table View */}
      <div className="hidden min-[768px]:block p-4 min-[768px]:p-6">
        <Table
          data={users}
          columns={usersColumns}
          searchable={true}
          searchPlaceholder="Search users by email or name..."
          emptyMessage="No users found."
          tableId="admin_users_table"
          defaultPageSize={10}
        />
      </div>

      {/* Mobile: Card View */}
      <div className="min-[768px]:hidden">
        {/* Search bar */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              data-table-search="admin_users_table"
              placeholder="Search users by email or name..."
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
        </div>

        {/* User Cards */}
        <div className="divide-y divide-border">
          {users.map((user) => (
            <div key={user.id} className="p-4">
              {/* Header: Email + Role Badge */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{user.email}</div>
                  {user.name && (
                    <div className="text-xs text-muted-foreground truncate mt-0.5">{user.name}</div>
                  )}
                </div>
                <Badge
                  variant={user.role === 'admin' ? 'error' : 'default'}
                  size="sm"
                >
                  {user.role || 'user'}
                </Badge>
              </div>

              {/* Stats Grid - 2x2 */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-muted/30 rounded-lg p-2 text-center">
                  <div className="text-xs text-muted-foreground mb-0.5">Webhooks</div>
                  <div className="text-sm font-semibold">{user.webhookCount}</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-2 text-center">
                  <div className="text-xs text-muted-foreground mb-0.5">Requests</div>
                  <div className="text-sm font-semibold">{user.requestCount.toLocaleString()}</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-2 text-center">
                  <div className="text-xs text-muted-foreground mb-0.5">Storage</div>
                  <div className="text-sm font-semibold">
                    {user.totalBytes < 1024 ? `${user.totalBytes} B` :
                     user.totalBytes < 1024 * 1024 ? `${(user.totalBytes / 1024).toFixed(1)} KB` :
                     `${(user.totalBytes / 1024 / 1024).toFixed(2)} MB`}
                  </div>
                </div>
                <div className="bg-muted/30 rounded-lg p-2 text-center">
                  <div className="text-xs text-muted-foreground mb-0.5">Verified</div>
                  <div className="text-sm font-semibold">
                    {user.emailVerified ? '✓ Yes' : '✗ No'}
                  </div>
                </div>
              </div>

              {/* Joined Date */}
              <div className="text-xs text-muted-foreground text-center mb-3">
                Joined: {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>

              {/* Impersonate Button - Full Width like Copy URL */}
              <Button
                color="secondary"
                style="soft"
                size="md"
                prefixIcon={IconUserCircle}
                data-action="impersonate-user"
                data-user-id={user.id}
                data-user-email={user.email}
                title={`Impersonate ${user.email}`}
                disabled={user.role === 'admin'}
                className="w-full"
              >
                Impersonate User
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
