/**
 * Test Table Handler - No Auth, Static Data
 * Debugging table column width issues
 */

import type { Context } from 'hono'
import { Table, type TableColumn } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import type { Bindings, Variables } from '@/types/hono'

// Static test data - real webhook data structure
const STATIC_DATA = [
  {
    id: '1',
    webhook_id: 'test',
    method: 'POST',
    headers: '{"content-type":"application/x-www-form-urlencoded","postman-token":"9acc6c05-c3ea-4e78-990a-c0d58a8a6702","accept-encoding":"br, gzip","content-length":"531","accept":"*/*","user-agent":"PostmanRuntime/7.50.0","cf-connecting-ip":"::1","host":"localhost:5174","cache-control":"no-cache"}',
    data: 'test=require%20%27net%2Fhttp%27%0Arequire%20%27json%27%0A%0Auri%20%3D%20URI%28%22http%3A%2F%2Flocalhost%3A5174%2Fw%2Fe186e42a-a3f9-49e4-8fd7-1bf393a9159b%22%29%0Ahttp%20%3D%20Net%3A%3AHTTP.new%28uri.host%2C%20uri.port%29%0Arequest%20%3D%20Net%3A%3AHTTP%3A%3APost.new%28uri.path%29%0Arequest%5B%22Content-Type%22%5D%20%3D%20%22application%2Fjson%22%0Arequest.body%20%3D%20%7B%20event%3A%20%22test%22%2C%20data%3A%20%7B%20key%3A%20%22value%22%20%7D%20%7D.to_json%0A%0Aresponse%20%3D%20http.request%28request%29%0Aputs%20response.body',
    size_bytes: 531,
    received_at: 1731093009
  },
  {
    id: '2',
    webhook_id: 'test',
    method: 'GET',
    headers: '{"accept":"application/json","user-agent":"Mozilla/5.0","authorization":"Bearer token123"}',
    data: '{"query":"search","limit":"10","filter":"active"}',
    size_bytes: 256,
    received_at: 1731089409
  },
  {
    id: '3',
    webhook_id: 'test',
    method: 'POST',
    headers: '{"content-type":"application/json","x-api-key":"secret123","accept":"*/*"}',
    data: '{"user":"john","email":"john@example.com","preferences":{"theme":"dark","notifications":true,"language":"en"}}',
    size_bytes: 1024,
    received_at: 1731085809
  }
]

export async function handleTestTable(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
  const requestsColumns: TableColumn<Record<string, unknown>>[] = [
    {
      key: 'received_at',
      label: 'Created At',
      sortable: true,
      width: 'w-[180px]',
      render: (value) => {
        const date = new Date((value as number) * 1000)
        return (
          <span className="text-xs">
            {date.toLocaleString()}
          </span>
        )
      }
    },
    {
      key: 'headers',
      label: 'Headers',
      width: 'w-[240px]',
      render: (value) => {
        try {
          const headers = JSON.parse(String(value))
          const headerEntries = Object.entries(headers)
          const headerCount = headerEntries.length

          return (
            <div className="max-w-full">
              <details className="cursor-pointer group">
                <summary className="list-none">
                  <span className="text-xs text-muted-foreground truncate block">
                    {headerCount} header{headerCount !== 1 ? 's' : ''}
                    <span className="text-primary hover:underline ml-1">→</span>
                  </span>
                </summary>
                <div className="mt-2 p-2 bg-muted rounded text-xs max-h-48 overflow-y-auto overflow-x-auto max-w-full">
                  {headerEntries.map(([key, val], idx) => (
                    <div key={idx} className="py-0.5 font-mono whitespace-nowrap">
                      <span className="text-primary">{key}</span>: {String(val)}
                    </div>
                  ))}
                </div>
              </details>
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
      width: 'w-[280px]',
      render: (value) => {
        try {
          const parsed = JSON.parse(String(value))
          const jsonString = JSON.stringify(parsed)
          const isTruncated = jsonString.length > 80
          const displayText = isTruncated ? jsonString.substring(0, 77) + '...' : jsonString

          return (
            <div className="max-w-full">
              <details className="cursor-pointer group">
                <summary className="list-none cursor-pointer">
                  <span className="text-xs font-mono">
                    {displayText}
                  </span>
                </summary>
                {isTruncated && (
                  <pre className="mt-2 p-2 bg-muted rounded text-xs max-h-48 overflow-y-auto break-words whitespace-pre-wrap">
                    {JSON.stringify(parsed, null, 2)}
                  </pre>
                )}
              </details>
            </div>
          )
        } catch {
          const textValue = String(value)
          const isTruncated = textValue.length > 80
          const displayText = isTruncated ? textValue.substring(0, 77) + '...' : textValue

          return (
            <div className="max-w-full">
              <details className="cursor-pointer group">
                <summary className="list-none cursor-pointer">
                  <span className="text-xs text-muted-foreground">
                    {displayText}
                  </span>
                </summary>
                {isTruncated && (
                  <pre className="mt-2 p-2 bg-muted rounded text-xs max-h-48 overflow-y-auto break-words whitespace-pre-wrap">
                    {textValue}
                  </pre>
                )}
              </details>
            </div>
          )
        }
      }
    },
    {
      key: 'method',
      label: 'Method',
      sortable: true,
      width: 'w-[100px]',
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
      width: 'w-[100px]',
      render: (value) => {
        const bytes = value as number
        if (bytes < 1024) return <span className="text-xs">{bytes} B</span>
        if (bytes < 1024 * 1024) return <span className="text-xs">{(bytes / 1024).toFixed(1)} KB</span>
        return <span className="text-xs">{(bytes / 1024 / 1024).toFixed(2)} MB</span>
      }
    }
  ]

  return c.render(
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Test Table - Column Width Debug</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Static test data ({STATIC_DATA.length} requests). No auth required.
        </p>

        <div className="bg-card rounded-lg border border-border p-6">
          <Table
            data={STATIC_DATA}
            columns={requestsColumns}
            searchable={true}
            searchPlaceholder="Search requests..."
            emptyMessage="No requests found"
            tableId="test-table"
            defaultPageSize={10}
          />
        </div>

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Debug Instructions:</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Click "6 headers →" to expand - column should NOT get wider</li>
            <li>Click payload preview to expand - column should NOT get wider</li>
            <li>Expanded content should scroll INSIDE the fixed-width cell</li>
            <li>Use browser DevTools to inspect table layout</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
