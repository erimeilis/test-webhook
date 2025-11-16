/**
 * Table Component
 * Modern data table with sorting, filtering, search, and pagination
 * Client-side interactivity handled via data attributes and routing.tsx
 */

import * as React from 'react'
import { Table as ResponsiveTable, Thead, Tbody, Tr, Th, Td } from 'react-super-responsive-table'
import { Pagination } from './Pagination'

export interface TableColumn<T> {
  key: string
  label: string
  sortable?: boolean
  filterable?: boolean
  render?: (value: unknown, row: T) => React.ReactNode
  width?: string
  className?: string
}

export interface TableProps<T> {
  data: T[]
  columns: TableColumn<T>[]
  searchable?: boolean
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  tableId?: string
  currentPage?: number
  defaultPageSize?: number
  filters?: React.ReactNode
  totalRecords?: number
}

export function Table<T extends Record<string, unknown>>({
  data,
  columns,
  searchable = true,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No data available',
  className = '',
  tableId = 'data-table',
  currentPage = 1,
  defaultPageSize = 10,
  filters,
  totalRecords
}: TableProps<T>) {
  // Server-side pagination: store total records for pagination controls
  const total = totalRecords ?? data.length
  const totalPages = Math.max(1, Math.ceil(total / defaultPageSize))
  const startIndex = total > 0 ? ((currentPage - 1) * defaultPageSize) + 1 : 0
  const endIndex = Math.min(((currentPage - 1) * defaultPageSize) + data.length, total)

  return (
    <div className={`w-full ${className}`} data-table-container={tableId} data-total-records={total}>
      {/* Search and Filters */}
      {(searchable || filters) && (
        <div className="mb-4 flex flex-col sm:flex-row gap-4 items-center sm:items-start">
          {/* Search bar */}
          {searchable && (
            <div className="relative w-full sm:flex-1 sm:max-w-sm">
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
                className="w-full h-9 pl-10 pr-4 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
          )}

          {/* Custom filters */}
          {filters && (
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start w-full sm:w-auto">
              {filters}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="border border-border rounded-lg">
        <ResponsiveTable className="w-full responsiveTable" data-table={tableId}>
          <Thead className="bg-muted/50 border-b border-border">
            <Tr>
              {columns.map((column) => (
                <Th
                  key={column.key}
                  className={`px-4 py-3 text-sm font-semibold ${
                    column.sortable ? 'cursor-pointer hover:bg-muted/70 select-none' : ''
                  } ${column.className || 'text-left'}`}
                  style={column.width ? { width: column.width } : undefined}
                  data-sortable={column.sortable ? 'true' : undefined}
                  data-sort-key={column.key}
                >
                  <div className={`flex items-center gap-2 ${
                    column.className?.includes('text-center') ? 'justify-center' :
                    column.className?.includes('text-right') ? 'justify-end' :
                    'justify-start'
                  }`}>
                    <span>{column.label}</span>
                    {column.sortable && (
                      <span className="text-muted-foreground flex-shrink-0" data-sort-icon={column.key}>
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
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody data-table-body={tableId}>
            {data.length === 0 ? (
              <Tr>
                <Td colSpan={columns.length} className="px-4 py-12 text-center text-muted-foreground">
                  {emptyMessage}
                </Td>
              </Tr>
            ) : (
              data.map((row, rowIndex) => (
                <Tr
                  key={rowIndex}
                  data-table-row
                  data-row-index={rowIndex}
                  className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
                >
                  {columns.map((column) => (
                    <Td
                      key={column.key}
                      className={`px-4 py-3 text-sm ${column.className || ''}`}
                      style={column.width ? { width: column.width } : undefined}
                      data-column={column.key}
                      data-label={column.label}
                      data-value={String(row[column.key] ?? '')}
                    >
                      {column.render
                        ? column.render(row[column.key], row)
                        : String(row[column.key] ?? '')}
                    </Td>
                  ))}
                </Tr>
              ))
            )}
          </Tbody>
        </ResponsiveTable>
      </div>

      {/* Pagination controls */}
      <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left: Page size selector */}
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

        {/* Right: Pagination component */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          showInfo={true}
          startIndex={startIndex}
          endIndex={endIndex}
          totalItems={total}
          tableId={tableId}
        />
      </div>
    </div>
  )
}
