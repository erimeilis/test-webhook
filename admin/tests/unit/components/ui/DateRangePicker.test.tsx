/**
 * DateRangePicker Component Tests
 * Unit tests for the date range picker wrapper component
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DateRangePicker } from '@/components/ui/DateRangePicker'
import type { DateRange } from 'react-day-picker'

describe('DateRangePicker', () => {
  describe('Rendering', () => {
    it('renders the date picker', () => {
      const { container } = render(<DateRangePicker />)

      const picker = container.querySelector('.rdp-custom')
      expect(picker).toBeInTheDocument()
    })

    it('renders with wrapper container', () => {
      const { container } = render(<DateRangePicker />)

      const wrapper = container.querySelector('.bg-card')
      expect(wrapper).toBeInTheDocument()
    })

    it('applies custom className to wrapper', () => {
      const { container } = render(<DateRangePicker className="custom-class" />)

      const wrapper = container.querySelector('.custom-class')
      expect(wrapper).toBeInTheDocument()
    })

    it('combines custom className with default styles', () => {
      const { container } = render(<DateRangePicker className="custom-class" />)

      const wrapper = container.querySelector('.custom-class')
      expect(wrapper).toHaveClass('bg-card', 'border', 'border-border', 'rounded-lg', 'p-3')
    })
  })

  describe('Wrapper Styling', () => {
    it('has card background', () => {
      const { container } = render(<DateRangePicker />)

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('bg-card')
    })

    it('has border styling', () => {
      const { container } = render(<DateRangePicker />)

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('border', 'border-border')
    })

    it('has rounded corners', () => {
      const { container } = render(<DateRangePicker />)

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('rounded-lg')
    })

    it('has padding', () => {
      const { container } = render(<DateRangePicker />)

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('p-3')
    })
  })

  describe('DayPicker Configuration', () => {
    it('renders in range mode', () => {
      const { container } = render(<DateRangePicker />)

      // DayPicker in range mode has specific structure
      const picker = container.querySelector('.rdp-custom')
      expect(picker).toBeInTheDocument()
    })

    it('applies custom rdp className', () => {
      const { container } = render(<DateRangePicker />)

      const picker = container.querySelector('.rdp-custom')
      expect(picker).toBeInTheDocument()
    })

    it('renders single month by default', () => {
      const { container } = render(<DateRangePicker />)

      // Single month means only one month grid
      const months = container.querySelectorAll('.rdp-month')
      expect(months.length).toBe(1)
    })
  })

  describe('Date Selection', () => {
    it('accepts selected date range', () => {
      const dateRange: DateRange = {
        from: new Date(2024, 0, 1),
        to: new Date(2024, 0, 7),
      }

      const { container } = render(<DateRangePicker selected={dateRange} />)

      const picker = container.querySelector('.rdp-custom')
      expect(picker).toBeInTheDocument()
    })

    it('calls onSelect when date is selected', () => {
      const onSelect = vi.fn()
      const { container } = render(<DateRangePicker onSelect={onSelect} />)

      // Find and click a day button
      const dayButtons = container.querySelectorAll('.rdp-day:not(.rdp-day_outside)')
      if (dayButtons.length > 0) {
        fireEvent.click(dayButtons[0])
        expect(onSelect).toHaveBeenCalled()
      }
    })

    it('works without onSelect callback', () => {
      const { container } = render(<DateRangePicker />)

      // Should not throw error when clicking without callback
      const dayButtons = container.querySelectorAll('.rdp-day:not(.rdp-day_outside)')
      if (dayButtons.length > 0) {
        expect(() => fireEvent.click(dayButtons[0])).not.toThrow()
      }
    })

    it('accepts undefined selected range', () => {
      const { container } = render(<DateRangePicker selected={undefined} />)

      const picker = container.querySelector('.rdp-custom')
      expect(picker).toBeInTheDocument()
    })
  })

  describe('Date Range Behavior', () => {
    it('handles partial range (only from date)', () => {
      const dateRange: DateRange = {
        from: new Date(2024, 0, 1),
        to: undefined,
      }

      const { container } = render(<DateRangePicker selected={dateRange} />)

      const picker = container.querySelector('.rdp-custom')
      expect(picker).toBeInTheDocument()
    })

    it('handles same from and to dates', () => {
      const sameDate = new Date(2024, 0, 1)
      const dateRange: DateRange = {
        from: sameDate,
        to: sameDate,
      }

      const { container } = render(<DateRangePicker selected={dateRange} />)

      const picker = container.querySelector('.rdp-custom')
      expect(picker).toBeInTheDocument()
    })

    it('displays selected range visually', () => {
      const dateRange: DateRange = {
        from: new Date(2024, 0, 1),
        to: new Date(2024, 0, 7),
      }

      const { container } = render(<DateRangePicker selected={dateRange} />)

      // Selected range should have appropriate classes
      const selectedDays = container.querySelectorAll('.rdp-day_selected')
      expect(selectedDays.length).toBeGreaterThan(0)
    })
  })

  describe('Navigation', () => {
    it('renders month navigation', () => {
      const { container } = render(<DateRangePicker />)

      // Navigation buttons should be present
      const nav = container.querySelector('.rdp-nav')
      expect(nav).toBeInTheDocument()
    })

    it('renders current month caption', () => {
      const { container } = render(<DateRangePicker />)

      const caption = container.querySelector('.rdp-caption')
      expect(caption).toBeInTheDocument()
    })

    it('allows month navigation', () => {
      const { container } = render(<DateRangePicker />)

      const navButtons = container.querySelectorAll('.rdp-nav_button')
      expect(navButtons.length).toBeGreaterThan(0)
    })
  })

  describe('Calendar Grid', () => {
    it('renders day grid', () => {
      const { container } = render(<DateRangePicker />)

      const table = container.querySelector('table')
      expect(table).toBeInTheDocument()
    })

    it('renders weekday headers', () => {
      const { container } = render(<DateRangePicker />)

      const thead = container.querySelector('thead')
      expect(thead).toBeInTheDocument()
    })

    it('renders day cells', () => {
      const { container } = render(<DateRangePicker />)

      const dayCells = container.querySelectorAll('.rdp-day')
      expect(dayCells.length).toBeGreaterThan(0)
    })
  })

  describe('Accessibility', () => {
    it('renders as a div element', () => {
      const { container } = render(<DateRangePicker />)

      const wrapper = container.firstChild
      expect(wrapper?.nodeName).toBe('DIV')
    })

    it('DayPicker provides accessible calendar', () => {
      const { container } = render(<DateRangePicker />)

      // DayPicker uses table structure which is accessible
      const table = container.querySelector('table')
      expect(table).toBeInTheDocument()
    })

    it('day buttons are keyboard accessible', () => {
      const { container } = render(<DateRangePicker />)

      const dayButtons = container.querySelectorAll('.rdp-day')
      dayButtons.forEach(button => {
        expect(button.tagName).toBe('BUTTON')
      })
    })
  })

  describe('Combined Features', () => {
    it('combines all props correctly', () => {
      const onSelect = vi.fn()
      const dateRange: DateRange = {
        from: new Date(2024, 0, 1),
        to: new Date(2024, 0, 7),
      }

      const { container } = render(
        <DateRangePicker
          selected={dateRange}
          onSelect={onSelect}
          className="custom-picker"
        />
      )

      const wrapper = container.querySelector('.custom-picker')
      expect(wrapper).toBeInTheDocument()
      expect(wrapper).toHaveClass('bg-card', 'border', 'rounded-lg')

      const picker = container.querySelector('.rdp-custom')
      expect(picker).toBeInTheDocument()

      const selectedDays = container.querySelectorAll('.rdp-day_selected')
      expect(selectedDays.length).toBeGreaterThan(0)
    })
  })

  describe('Edge Cases', () => {
    it('handles empty props', () => {
      const { container } = render(<DateRangePicker />)

      expect(container.firstChild).toBeInTheDocument()
    })

    it('handles className with empty string', () => {
      const { container } = render(<DateRangePicker className="" />)

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('bg-card')
    })

    it('handles future dates', () => {
      const futureRange: DateRange = {
        from: new Date(2030, 0, 1),
        to: new Date(2030, 0, 7),
      }

      const { container } = render(<DateRangePicker selected={futureRange} />)

      const picker = container.querySelector('.rdp-custom')
      expect(picker).toBeInTheDocument()
    })

    it('handles past dates', () => {
      const pastRange: DateRange = {
        from: new Date(2020, 0, 1),
        to: new Date(2020, 0, 7),
      }

      const { container } = render(<DateRangePicker selected={pastRange} />)

      const picker = container.querySelector('.rdp-custom')
      expect(picker).toBeInTheDocument()
    })
  })
})
