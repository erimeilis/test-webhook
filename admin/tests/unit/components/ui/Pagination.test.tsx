/**
 * Pagination Component Tests
 * Unit tests for the pagination controls with page generation logic
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Pagination } from '@/components/ui/Pagination'

describe('Pagination', () => {
  describe('Rendering', () => {
    it('renders pagination controls', () => {
      render(<Pagination currentPage={1} totalPages={5} />)

      expect(screen.getByTitle('Previous page')).toBeInTheDocument()
      expect(screen.getByTitle('Next page')).toBeInTheDocument()
    })

    it('renders page numbers', () => {
      render(<Pagination currentPage={1} totalPages={3} />)

      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('renders info display by default', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          startIndex={1}
          endIndex={10}
          totalItems={50}
        />
      )

      expect(screen.getByText('1', { exact: false })).toBeInTheDocument()
      expect(screen.getByText('10', { exact: false })).toBeInTheDocument()
      expect(screen.getByText('50', { exact: false })).toBeInTheDocument()
    })

    it('hides info display when showInfo is false', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          startIndex={1}
          endIndex={10}
          totalItems={50}
          showInfo={false}
        />
      )

      // Info text should not be present
      expect(screen.queryByText('Showing')).not.toBeInTheDocument()
    })

    it('applies custom className', () => {
      const { container } = render(
        <Pagination currentPage={1} totalPages={5} className="custom-class" />
      )

      const pagination = container.querySelector('.custom-class')
      expect(pagination).toBeInTheDocument()
    })
  })

  describe('Page Number Generation', () => {
    it('shows all pages when total is 5 or less', () => {
      render(<Pagination currentPage={3} totalPages={5} />)

      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('4')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.queryByText('...')).not.toBeInTheDocument()
    })

    it('shows ellipsis when total pages exceed 5', () => {
      render(<Pagination currentPage={5} totalPages={10} />)

      expect(screen.getAllByText('...')).toHaveLength(2)
    })

    it('shows first and last pages always', () => {
      render(<Pagination currentPage={5} totalPages={10} />)

      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('10')).toBeInTheDocument()
    })

    it('shows pages around current page', () => {
      render(<Pagination currentPage={5} totalPages={10} />)

      expect(screen.getByText('4')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('6')).toBeInTheDocument()
    })

    it('does not show left ellipsis when current page is near start', () => {
      render(<Pagination currentPage={2} totalPages={10} />)

      const ellipses = screen.queryAllByText('...')
      expect(ellipses.length).toBeLessThanOrEqual(1)
    })

    it('does not show right ellipsis when current page is near end', () => {
      render(<Pagination currentPage={9} totalPages={10} />)

      const ellipses = screen.queryAllByText('...')
      expect(ellipses.length).toBeLessThanOrEqual(1)
    })

    it('handles single page correctly', () => {
      render(<Pagination currentPage={1} totalPages={1} />)

      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.queryByText('...')).not.toBeInTheDocument()
    })

    it('handles two pages correctly', () => {
      render(<Pagination currentPage={1} totalPages={2} />)

      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.queryByText('...')).not.toBeInTheDocument()
    })
  })

  describe('Previous Button', () => {
    it('is disabled on first page', () => {
      render(<Pagination currentPage={1} totalPages={5} />)

      const prevButton = screen.getByTitle('Previous page')
      expect(prevButton).toBeDisabled()
    })

    it('is enabled when not on first page', () => {
      render(<Pagination currentPage={2} totalPages={5} />)

      const prevButton = screen.getByTitle('Previous page')
      expect(prevButton).not.toBeDisabled()
    })

    it('has correct data attribute', () => {
      render(<Pagination currentPage={1} totalPages={5} tableId="webhooks" />)

      const prevButton = screen.getByTitle('Previous page')
      expect(prevButton).toHaveAttribute('data-pagination-prev', 'webhooks')
    })

    it('uses default tableId when not provided', () => {
      render(<Pagination currentPage={1} totalPages={5} />)

      const prevButton = screen.getByTitle('Previous page')
      expect(prevButton).toHaveAttribute('data-pagination-prev', 'table')
    })
  })

  describe('Next Button', () => {
    it('is disabled on last page', () => {
      render(<Pagination currentPage={5} totalPages={5} />)

      const nextButton = screen.getByTitle('Next page')
      expect(nextButton).toBeDisabled()
    })

    it('is enabled when not on last page', () => {
      render(<Pagination currentPage={4} totalPages={5} />)

      const nextButton = screen.getByTitle('Next page')
      expect(nextButton).not.toBeDisabled()
    })

    it('has correct data attribute', () => {
      render(<Pagination currentPage={1} totalPages={5} tableId="webhooks" />)

      const nextButton = screen.getByTitle('Next page')
      expect(nextButton).toHaveAttribute('data-pagination-next', 'webhooks')
    })

    it('uses default tableId when not provided', () => {
      render(<Pagination currentPage={1} totalPages={5} />)

      const nextButton = screen.getByTitle('Next page')
      expect(nextButton).toHaveAttribute('data-pagination-next', 'table')
    })
  })

  describe('Page Number Buttons', () => {
    it('marks current page as active', () => {
      render(<Pagination currentPage={3} totalPages={5} />)

      const pageButton = screen.getByText('3')
      expect(pageButton).toBeDisabled()
    })

    it('current page uses soft style', () => {
      const { container } = render(<Pagination currentPage={3} totalPages={5} />)

      const pageButton = screen.getByText('3')
      expect(pageButton).toHaveClass('btn-soft')
    })

    it('non-current pages use ghost style', () => {
      const { container } = render(<Pagination currentPage={3} totalPages={5} />)

      const pageButton = screen.getByText('2')
      expect(pageButton).toHaveClass('btn-ghost')
    })

    it('has data-pagination-page attribute with page number', () => {
      render(<Pagination currentPage={1} totalPages={5} />)

      const pageButton = screen.getByText('3')
      expect(pageButton).toHaveAttribute('data-pagination-page', '3')
    })

    it('all page buttons are not disabled except current', () => {
      render(<Pagination currentPage={3} totalPages={5} />)

      expect(screen.getByText('1')).not.toBeDisabled()
      expect(screen.getByText('2')).not.toBeDisabled()
      expect(screen.getByText('3')).toBeDisabled()
      expect(screen.getByText('4')).not.toBeDisabled()
      expect(screen.getByText('5')).not.toBeDisabled()
    })
  })

  describe('Info Display', () => {
    it('displays correct range information', () => {
      const { container } = render(
        <Pagination
          currentPage={2}
          totalPages={5}
          startIndex={11}
          endIndex={20}
          totalItems={50}
        />
      )

      const infoText = container.textContent
      expect(infoText).toContain('11')
      expect(infoText).toContain('20')
      expect(infoText).toContain('50')
    })

    it('shows zero values correctly', () => {
      const { container } = render(
        <Pagination
          currentPage={1}
          totalPages={1}
          startIndex={0}
          endIndex={0}
          totalItems={0}
        />
      )

      const infoText = container.textContent
      expect(infoText).toContain('0')
    })

    it('uses default values when not provided', () => {
      const { container } = render(<Pagination currentPage={1} totalPages={5} />)

      const infoText = container.textContent
      expect(infoText).toContain('0')
    })
  })

  describe('Button Sizing', () => {
    it('uses xs size for all buttons', () => {
      render(<Pagination currentPage={3} totalPages={5} />)

      const prevButton = screen.getByTitle('Previous page')
      const nextButton = screen.getByTitle('Next page')
      const pageButton = screen.getByText('3')

      expect(prevButton).toHaveClass('btn-xs')
      expect(nextButton).toHaveClass('btn-xs')
      expect(pageButton).toHaveClass('btn-xs')
    })

    it('applies consistent height and padding', () => {
      render(<Pagination currentPage={3} totalPages={5} />)

      const prevButton = screen.getByTitle('Previous page')
      const pageButton = screen.getByText('3')

      expect(prevButton).toHaveClass('h-7', 'px-2')
      expect(pageButton).toHaveClass('h-7', 'px-2')
    })
  })

  describe('Ellipsis Rendering', () => {
    it('renders ellipsis with correct styling', () => {
      const { container } = render(<Pagination currentPage={5} totalPages={10} />)

      const ellipses = screen.getAllByText('...')
      ellipses.forEach(ellipsis => {
        expect(ellipsis).toHaveClass('text-muted-foreground')
      })
    })

    it('ellipsis is not a button', () => {
      render(<Pagination currentPage={5} totalPages={10} />)

      const ellipses = screen.getAllByText('...')
      ellipses.forEach(ellipsis => {
        expect(ellipsis.tagName).not.toBe('BUTTON')
      })
    })
  })

  describe('Layout', () => {
    it('arranges controls in flex layout', () => {
      const { container } = render(<Pagination currentPage={1} totalPages={5} />)

      const pagination = container.firstChild as HTMLElement
      expect(pagination).toHaveClass('flex', 'items-center', 'justify-between')
    })

    it('groups page numbers with gap', () => {
      const { container } = render(<Pagination currentPage={1} totalPages={5} />)

      const pageGroup = container.querySelector('.flex.gap-1')
      expect(pageGroup).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles very large page counts', () => {
      render(<Pagination currentPage={50} totalPages={100} />)

      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('100')).toBeInTheDocument()
      expect(screen.getByText('49')).toBeInTheDocument()
      expect(screen.getByText('50')).toBeInTheDocument()
      expect(screen.getByText('51')).toBeInTheDocument()
    })

    it('handles page 1 of many', () => {
      render(<Pagination currentPage={1} totalPages={100} />)

      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('100')).toBeInTheDocument()
    })

    it('handles last page of many', () => {
      render(<Pagination currentPage={100} totalPages={100} />)

      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('99')).toBeInTheDocument()
      expect(screen.getByText('100')).toBeInTheDocument()
    })
  })

  describe('Combined Features', () => {
    it('combines all props correctly', () => {
      const { container } = render(
        <Pagination
          currentPage={3}
          totalPages={10}
          showInfo={true}
          startIndex={21}
          endIndex={30}
          totalItems={100}
          className="custom-pagination"
          tableId="webhooks"
        />
      )

      expect(container.querySelector('.custom-pagination')).toBeInTheDocument()
      expect(screen.getByTitle('Previous page')).toHaveAttribute(
        'data-pagination-prev',
        'webhooks'
      )
      expect(screen.getByText('21', { exact: false })).toBeInTheDocument()
      expect(screen.getByText('3')).toBeDisabled()
    })
  })
})
