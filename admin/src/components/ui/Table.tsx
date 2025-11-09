/**
 * Table Component
 * Modern data table with sorting, filtering, search, and pagination
 * Client-side interactivity handled via data attributes and routing.tsx
 */

import * as React from 'react'

export interface TableColumn<T> {
  key: string
  label: string
  sortable?: boolean
  filterable?: boolean
  render?: (value: unknown, row: T) => React.ReactNode
  width?: string
}

export interface TableProps<T> {
  data: T[]
  columns: TableColumn<T>[]
  searchable?: boolean
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  tableId?: string
  defaultPageSize?: number
}

export function Table<T extends Record<string, unknown>>({
  data,
  columns,
  searchable = true,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No data available',
  className = '',
  tableId = 'data-table',
  defaultPageSize = 10
}: TableProps<T>) {
  // Store all data as JSON in a data attribute for client-side manipulation
  const dataJson = JSON.stringify(data)

  // Helper function to extract pixel width from Tailwind class (e.g., "w-[180px]" → "180px")
  const extractWidth = (widthClass?: string): string | undefined => {
    if (!widthClass) return undefined
    const match = widthClass.match(/w-\[(\d+px)\]/)
    return match ? match[1] : undefined
  }

  return (
    <div className={`w-full ${className}`} data-table-container={tableId} data-all-data={dataJson}>
      {/* Search bar only at top */}
      {searchable && (
        <div className="mb-4">
          <div className="relative max-w-sm">
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
              data-table-search={tableId}
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto border border-border rounded-lg">
        <table className="w-full table-fixed" data-table={tableId}>
          <colgroup>
            {columns.map((column) => (
              <col key={column.key} className={column.width || ''} />
            ))}
          </colgroup>
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`text-left px-4 py-3 text-sm font-semibold ${
                    column.sortable ? 'cursor-pointer hover:bg-muted/70 select-none' : ''
                  }`}
                  data-sortable={column.sortable ? 'true' : undefined}
                  data-sort-key={column.key}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.label}</span>
                    {column.sortable && (
                      <span className="text-muted-foreground" data-sort-icon={column.key}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="opacity-50"
                        >
                          <path d="m7 15 5 5 5-5" />
                          <path d="m7 9 5-5 5 5" />
                        </svg>
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody data-table-body={tableId}>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  data-table-row
                  data-row-index={rowIndex}
                  className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
                >
                  {columns.map((column) => {
                    const width = extractWidth(column.width)
                    const cellStyle = width ? { width, maxWidth: width } : undefined

                    return (
                      <td
                        key={column.key}
                        className="px-4 py-3 text-sm overflow-hidden"
                        style={cellStyle}
                        data-column={column.key}
                        data-value={String(row[column.key] ?? '')}
                      >
                        {column.render
                          ? column.render(row[column.key], row)
                          : String(row[column.key] ?? '')}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls and results count */}
      <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left: Show selector and results info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show</span>
            <select
              data-table-page-size={tableId}
              className="px-3 py-1.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              defaultValue={defaultPageSize}
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <span className="text-sm text-muted-foreground">entries</span>
          </div>
          <div className="text-sm text-muted-foreground" data-table-info={tableId}>
            Showing 1 to {Math.min(defaultPageSize, data.length)} of {data.length} entries
          </div>
        </div>

        {/* Right: Pagination */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto" data-table-pagination={tableId}>
          <button
            data-table-first={tableId}
            className="px-2 sm:px-3 py-1.5 text-sm border border-border rounded hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            title="First page"
          >
            «
          </button>
          <button
            data-table-prev={tableId}
            className="px-2 sm:px-3 py-1.5 text-sm border border-border rounded hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            title="Previous page"
          >
            ‹
          </button>

          {/* Page numbers will be inserted here by JavaScript */}
          <div data-table-page-numbers={tableId} className="flex items-center gap-1">
            <button className="px-2 sm:px-3 py-1.5 text-sm border border-border rounded bg-primary text-primary-foreground flex-shrink-0">
              1
            </button>
          </div>

          <button
            data-table-next={tableId}
            className="px-2 sm:px-3 py-1.5 text-sm border border-border rounded hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            title="Next page"
          >
            ›
          </button>
          <button
            data-table-last={tableId}
            className="px-2 sm:px-3 py-1.5 text-sm border border-border rounded hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            title="Last page"
          >
            »
          </button>
        </div>
      </div>
    </div>
  )
}
