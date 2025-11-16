/**
 * Select Component Tests
 * Unit tests for the select dropdown component with variant support
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Select } from '@/components/ui/Select'

describe('Select', () => {
  const defaultOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ]

  describe('Rendering', () => {
    it('renders as a select element', () => {
      render(<Select options={defaultOptions} />)

      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('renders all options', () => {
      render(<Select options={defaultOptions} />)

      expect(screen.getByRole('option', { name: 'Option 1' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Option 2' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Option 3' })).toBeInTheDocument()
    })

    it('renders with placeholder', () => {
      render(<Select options={defaultOptions} placeholder="Choose an option" />)

      expect(screen.getByRole('option', { name: 'Choose an option' })).toBeInTheDocument()
    })

    it('placeholder is disabled', () => {
      render(<Select options={defaultOptions} placeholder="Choose" />)

      const placeholder = screen.getByRole('option', { name: 'Choose' }) as HTMLOptionElement
      expect(placeholder).toHaveAttribute('disabled')
    })

    it('applies custom className', () => {
      render(<Select options={defaultOptions} className="custom-class" />)

      expect(screen.getByRole('combobox')).toHaveClass('custom-class')
    })
  })

  describe('Variants', () => {
    it('applies default variant by default', () => {
      render(<Select options={defaultOptions} />)

      const select = screen.getByRole('combobox')
      expect(select).toHaveClass('border-border', 'focus:border-primary', 'focus:ring-primary/50')
    })

    it('applies primary variant', () => {
      render(<Select options={defaultOptions} variant="primary" />)

      const select = screen.getByRole('combobox')
      expect(select).toHaveClass('border-primary', 'focus:ring-primary/50')
    })

    it('applies error variant', () => {
      render(<Select options={defaultOptions} variant="error" />)

      const select = screen.getByRole('combobox')
      expect(select).toHaveClass('border-destructive', 'focus:ring-destructive/50')
    })

    it('applies success variant', () => {
      render(<Select options={defaultOptions} variant="success" />)

      const select = screen.getByRole('combobox')
      expect(select).toHaveClass('border-green-500', 'focus:ring-green-500/50')
    })
  })

  describe('Sizes', () => {
    it('applies medium size by default', () => {
      render(<Select options={defaultOptions} />)

      const select = screen.getByRole('combobox')
      expect(select).toHaveClass('px-4', 'py-2', 'text-sm')
    })

    it('applies small size', () => {
      render(<Select options={defaultOptions} size="sm" />)

      const select = screen.getByRole('combobox')
      expect(select).toHaveClass('px-3', 'py-1.5', 'text-xs')
    })

    it('applies large size', () => {
      render(<Select options={defaultOptions} size="lg" />)

      const select = screen.getByRole('combobox')
      expect(select).toHaveClass('px-6', 'py-3', 'text-base')
    })
  })

  describe('Form Attributes', () => {
    it('accepts name attribute', () => {
      render(<Select options={defaultOptions} name="category" />)

      expect(screen.getByRole('combobox')).toHaveAttribute('name', 'category')
    })

    it('accepts id attribute', () => {
      render(<Select options={defaultOptions} id="category-select" />)

      expect(screen.getByRole('combobox')).toHaveAttribute('id', 'category-select')
    })

    it('accepts required attribute', () => {
      render(<Select options={defaultOptions} required />)

      expect(screen.getByRole('combobox')).toBeRequired()
    })

    it('is not required by default', () => {
      render(<Select options={defaultOptions} />)

      expect(screen.getByRole('combobox')).not.toBeRequired()
    })
  })

  describe('Value Control', () => {
    it('accepts controlled value', () => {
      render(<Select options={defaultOptions} value="option2" onChange={() => {}} />)

      expect(screen.getByRole('combobox')).toHaveValue('option2')
    })

    it('updates value when changed', () => {
      const onChange = vi.fn()
      render(<Select options={defaultOptions} value="option1" onChange={onChange} />)

      const select = screen.getByRole('combobox')
      fireEvent.change(select, { target: { value: 'option2' } })

      expect(onChange).toHaveBeenCalled()
    })
  })

  describe('Disabled State', () => {
    it('is not disabled by default', () => {
      render(<Select options={defaultOptions} />)

      expect(screen.getByRole('combobox')).not.toBeDisabled()
    })

    it('can be disabled', () => {
      render(<Select options={defaultOptions} disabled />)

      expect(screen.getByRole('combobox')).toBeDisabled()
    })

    it('applies disabled styles when disabled', () => {
      render(<Select options={defaultOptions} disabled />)

      const select = screen.getByRole('combobox')
      expect(select).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed')
    })
  })

  describe('onChange Handler', () => {
    it('calls onChange handler when selection changes', () => {
      const onChange = vi.fn()
      render(<Select options={defaultOptions} onChange={onChange} />)

      const select = screen.getByRole('combobox')
      fireEvent.change(select, { target: { value: 'option2' } })

      expect(onChange).toHaveBeenCalledTimes(1)
    })

    it('passes event to onChange handler', () => {
      const onChange = vi.fn()
      render(<Select options={defaultOptions} onChange={onChange} />)

      const select = screen.getByRole('combobox')
      fireEvent.change(select, { target: { value: 'option3' } })

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({
            value: 'option3'
          })
        })
      )
    })
  })

  describe('Styling', () => {
    it('has base styles', () => {
      render(<Select options={defaultOptions} />)

      const select = screen.getByRole('combobox')
      expect(select).toHaveClass(
        'w-full',
        'rounded',
        'border',
        'bg-background',
        'transition-all',
        'focus:outline-none',
        'focus:ring-2',
        'appearance-none'
      )
    })

    it('has full width', () => {
      render(<Select options={defaultOptions} />)

      expect(screen.getByRole('combobox')).toHaveClass('w-full')
    })

    it('has custom arrow indicator', () => {
      render(<Select options={defaultOptions} />)

      const select = screen.getByRole('combobox')
      expect(select).toHaveClass('bg-no-repeat')
    })
  })

  describe('Accessibility', () => {
    it('has proper role', () => {
      render(<Select options={defaultOptions} />)

      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('can receive keyboard focus', () => {
      render(<Select options={defaultOptions} />)

      const select = screen.getByRole('combobox')
      select.focus()

      expect(document.activeElement).toBe(select)
    })

    it('cannot receive keyboard focus when disabled', () => {
      render(<Select options={defaultOptions} disabled />)

      const select = screen.getByRole('combobox')
      select.focus()

      expect(document.activeElement).not.toBe(select)
    })
  })

  describe('Combined Features', () => {
    it('combines variant and size', () => {
      render(<Select options={defaultOptions} variant="primary" size="lg" />)

      const select = screen.getByRole('combobox')
      expect(select).toHaveClass('border-primary') // primary variant
      expect(select).toHaveClass('px-6', 'py-3') // large size
    })

    it('combines all props', () => {
      const onChange = vi.fn()
      render(
        <Select
          options={defaultOptions}
          variant="success"
          size="sm"
          placeholder="Choose"
          name="category"
          id="cat-select"
          required
          value="option1"
          onChange={onChange}
        />
      )

      const select = screen.getByRole('combobox')
      expect(select).toHaveClass('border-green-500') // success variant
      expect(select).toHaveClass('px-3', 'py-1.5') // small size
      expect(screen.getByRole('option', { name: 'Choose' })).toBeInTheDocument()
      expect(select).toHaveAttribute('name', 'category')
      expect(select).toHaveAttribute('id', 'cat-select')
      expect(select).toBeRequired()
      expect(select).toHaveValue('option1')
    })
  })
})
