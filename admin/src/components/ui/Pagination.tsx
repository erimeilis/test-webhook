/**
 * Pagination Component - DaisyUI Style
 * Reusable pagination controls with consistent styling
 */

import { Button } from './Button'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange?: (page: number) => void
  showInfo?: boolean
  startIndex?: number
  endIndex?: number
  totalItems?: number
  className?: string
  tableId?: string
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange: _onPageChange,
  showInfo = true,
  startIndex = 0,
  endIndex = 0,
  totalItems = 0,
  className = '',
  tableId = 'table',
}: PaginationProps) {
  const generatePageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      if (currentPage > 3) {
        pages.push('...')
      }

      // Show pages around current
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push('...')
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages)
      }
    }

    return pages
  }

  const pageNumbers = generatePageNumbers()

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {showInfo && (
        <div className="text-sm text-muted-foreground mr-2">
          Showing <span className="font-medium">{startIndex}</span>-
          <span className="font-medium">{endIndex}</span> of{' '}
          <span className="font-medium">{totalItems}</span>&nbsp;
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <Button
          data-pagination-prev={tableId}
          disabled={currentPage <= 1}
          style="ghost"
          size="xs"
          className="w-7 h-7 flex items-center justify-center flex-shrink-0"
          title="Previous page"
        >
          ‹
        </Button>

        {/* Page Numbers */}
        <div className="flex gap-1">
          {pageNumbers.map((page, index) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-3 py-1.5 text-sm text-muted-foreground"
                >
                  ...
                </span>
              )
            }

            const pageNum = page as number
            const isActive = pageNum === currentPage

            return (
              <Button
                key={pageNum}
                data-pagination-page={pageNum}
                disabled={isActive}
                style={isActive ? 'soft' : 'ghost'}
                size="xs"
                className="w-7 h-7 flex items-center justify-center flex-shrink-0"
              >
                {pageNum}
              </Button>
            )
          })}
        </div>

        {/* Next Button */}
        <Button
          data-pagination-next={tableId}
          disabled={currentPage >= totalPages}
          style="ghost"
          size="xs"
          className="w-7 h-7 flex items-center justify-center flex-shrink-0"
          title="Next page"
        >
          ›
        </Button>
      </div>
    </div>
  )
}
