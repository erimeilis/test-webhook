/**
 * ToggleSwitch Component Tests
 * Unit tests for the triple toggle switch with variant support
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ToggleSwitch } from './ToggleSwitch'

describe('ToggleSwitch', () => {
  const defaultOptions = [
    { value: 'all', label: 'All' },
    { value: 'GET', label: 'GET' },
    { value: 'POST', label: 'POST' },
  ]

  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<ToggleSwitch options={defaultOptions} />)

      expect(screen.getByText('All')).toBeInTheDocument()
      expect(screen.getByText('GET')).toBeInTheDocument()
      expect(screen.getByText('POST')).toBeInTheDocument()
    })

    it('renders with custom data attribute', () => {
      const { container } = render(
        <ToggleSwitch
          options={defaultOptions}
          dataAttribute="custom-filter"
        />
      )

      const toggle = container.querySelector('[data-toggle-switch="custom-filter"]')
      expect(toggle).toBeInTheDocument()
    })

    it('renders with default data attribute when not provided', () => {
      const { container } = render(<ToggleSwitch options={defaultOptions} />)

      const toggle = container.querySelector('[data-toggle-switch="toggle-switch"]')
      expect(toggle).toBeInTheDocument()
    })

    it('renders correct number of buttons', () => {
      render(<ToggleSwitch options={defaultOptions} />)

      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(3)
    })

    it('renders indicator element', () => {
      const { container } = render(<ToggleSwitch options={defaultOptions} />)

      const indicator = container.querySelector('[data-toggle-indicator]')
      expect(indicator).toBeInTheDocument()
    })
  })

  describe('Default Value', () => {
    it('activates first option by default', () => {
      const { container } = render(<ToggleSwitch options={defaultOptions} />)

      const allButton = screen.getByText('All')
      expect(allButton).toHaveClass('text-primary-foreground')

      const indicator = container.querySelector('[data-toggle-indicator]') as HTMLElement
      expect(indicator?.style.transform).toBe('translateX(calc(0% + 0.25rem))')
    })

    it('activates specified default value', () => {
      const { container } = render(
        <ToggleSwitch options={defaultOptions} defaultValue="GET" />
      )

      const getButton = screen.getByText('GET')
      expect(getButton).toHaveClass('text-primary-foreground')

      const indicator = container.querySelector('[data-toggle-indicator]') as HTMLElement
      expect(indicator?.style.transform).toBe('translateX(calc(100% + 0.25rem))')
    })

    it('falls back to first option if invalid default value', () => {
      const { container } = render(
        <ToggleSwitch options={defaultOptions} defaultValue="INVALID" />
      )

      const allButton = screen.getByText('All')
      expect(allButton).toHaveClass('text-primary-foreground')

      const indicator = container.querySelector('[data-toggle-indicator]') as HTMLElement
      expect(indicator?.style.transform).toBe('translateX(calc(0% + 0.25rem))')
    })
  })

  describe('Style Variants', () => {
    it('applies solid style by default', () => {
      const { container } = render(<ToggleSwitch options={defaultOptions} />)

      const toggle = container.querySelector('[data-toggle-switch]')
      expect(toggle).toHaveClass('bg-background', 'border', 'border-border')
    })

    it('applies soft style when specified', () => {
      const { container } = render(
        <ToggleSwitch options={defaultOptions} style="soft" />
      )

      const toggle = container.querySelector('[data-toggle-switch]')
      expect(toggle).toHaveClass('bg-muted/50', 'border', 'border-border/50')
    })

    it('applies outline style when specified', () => {
      const { container } = render(
        <ToggleSwitch options={defaultOptions} style="outline" />
      )

      const toggle = container.querySelector('[data-toggle-switch]')
      expect(toggle).toHaveClass('bg-transparent', 'border-2', 'border-border')
    })
  })

  describe('Color Variants', () => {
    it('applies primary color by default', () => {
      const { container } = render(<ToggleSwitch options={defaultOptions} />)

      const indicator = container.querySelector('[data-toggle-indicator]')
      expect(indicator).toHaveClass('bg-primary')
    })

    it('applies secondary color when specified', () => {
      const { container } = render(
        <ToggleSwitch options={defaultOptions} color="secondary" />
      )

      const indicator = container.querySelector('[data-toggle-indicator]')
      expect(indicator).toHaveClass('bg-secondary')
    })

    it('applies success color when specified', () => {
      const { container } = render(
        <ToggleSwitch options={defaultOptions} color="success" />
      )

      const indicator = container.querySelector('[data-toggle-indicator]')
      expect(indicator).toHaveClass('bg-success')
    })

    it('applies error color when specified', () => {
      const { container } = render(
        <ToggleSwitch options={defaultOptions} color="error" />
      )

      const indicator = container.querySelector('[data-toggle-indicator]')
      expect(indicator).toHaveClass('bg-destructive')
    })
  })

  describe('Accessibility', () => {
    it('renders buttons with type="button"', () => {
      render(<ToggleSwitch options={defaultOptions} />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button')
      })
    })

    it('has pointer cursor on buttons', () => {
      render(<ToggleSwitch options={defaultOptions} />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveClass('cursor-pointer')
      })
    })

    it('sets data-toggle-value attribute on buttons', () => {
      render(<ToggleSwitch options={defaultOptions} />)

      const allButton = screen.getByText('All')
      const getButton = screen.getByText('GET')
      const postButton = screen.getByText('POST')

      expect(allButton).toHaveAttribute('data-toggle-value', 'all')
      expect(getButton).toHaveAttribute('data-toggle-value', 'GET')
      expect(postButton).toHaveAttribute('data-toggle-value', 'POST')
    })

    it('indicator has pointer-events-none to prevent blocking clicks', () => {
      const { container } = render(<ToggleSwitch options={defaultOptions} />)

      const indicator = container.querySelector('[data-toggle-indicator]')
      expect(indicator).toHaveClass('pointer-events-none')
    })
  })

  describe('Layout', () => {
    it('calculates indicator width based on option count', () => {
      const { container } = render(<ToggleSwitch options={defaultOptions} />)

      const indicator = container.querySelector('[data-toggle-indicator]') as HTMLElement
      expect(indicator?.style.width).toBe('calc(33.333333333333336% - 0.5rem)')
    })

    it('adjusts indicator width for 2 options', () => {
      const twoOptions = [
        { value: 'on', label: 'On' },
        { value: 'off', label: 'Off' },
      ]
      const { container } = render(<ToggleSwitch options={twoOptions} />)

      const indicator = container.querySelector('[data-toggle-indicator]') as HTMLElement
      expect(indicator?.style.width).toBe('calc(50% - 0.5rem)')
    })

    it('sets minimum width on buttons', () => {
      render(<ToggleSwitch options={defaultOptions} />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect((button as HTMLElement).style.minWidth).toBe('3.5rem')
      })
    })

    it('applies custom className', () => {
      const { container } = render(
        <ToggleSwitch options={defaultOptions} className="custom-class" />
      )

      const toggle = container.querySelector('[data-toggle-switch]')
      expect(toggle).toHaveClass('custom-class')
    })
  })

  describe('Edge Cases', () => {
    it('warns when options count is less than 2', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      render(<ToggleSwitch options={[{ value: 'one', label: 'One' }]} />)

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'ToggleSwitch: options should contain 2-3 items'
      )

      consoleWarnSpy.mockRestore()
    })

    it('warns when options count is more than 3', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const fourOptions = [
        { value: '1', label: 'One' },
        { value: '2', label: 'Two' },
        { value: '3', label: 'Three' },
        { value: '4', label: 'Four' },
      ]
      render(<ToggleSwitch options={fourOptions} />)

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'ToggleSwitch: options should contain 2-3 items'
      )

      consoleWarnSpy.mockRestore()
    })

    it('renders correctly with 2 options', () => {
      const twoOptions = [
        { value: 'on', label: 'On' },
        { value: 'off', label: 'Off' },
      ]
      render(<ToggleSwitch options={twoOptions} />)

      expect(screen.getByText('On')).toBeInTheDocument()
      expect(screen.getByText('Off')).toBeInTheDocument()
    })

    it('still renders with 4 options despite warning', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const fourOptions = [
        { value: '1', label: 'One' },
        { value: '2', label: 'Two' },
        { value: '3', label: 'Three' },
        { value: '4', label: 'Four' },
      ]
      render(<ToggleSwitch options={fourOptions} />)

      expect(screen.getByText('One')).toBeInTheDocument()
      expect(screen.getByText('Four')).toBeInTheDocument()

      consoleWarnSpy.mockRestore()
    })
  })

  describe('Compound Variants', () => {
    it('applies correct classes for soft + primary', () => {
      const { container } = render(
        <ToggleSwitch
          options={defaultOptions}
          color="primary"
          style="soft"
        />
      )

      const indicator = container.querySelector('[data-toggle-indicator]')
      expect(indicator).toHaveClass('bg-primary', 'opacity-60')

      const activeButton = screen.getByText('All')
      expect(activeButton).toHaveClass('text-primary')
    })

    it('applies correct classes for outline + success', () => {
      const { container } = render(
        <ToggleSwitch
          options={defaultOptions}
          color="success"
          style="outline"
        />
      )

      const indicator = container.querySelector('[data-toggle-indicator]')
      expect(indicator).toHaveClass('bg-transparent', 'border-success')

      const activeButton = screen.getByText('All')
      expect(activeButton).toHaveClass('text-success')
    })
  })
})
