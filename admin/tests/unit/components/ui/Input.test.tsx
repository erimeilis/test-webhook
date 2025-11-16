/**
 * Input Component Tests
 * Unit tests for the input field component with variant support
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Input } from '@/components/ui/Input'

describe('Input', () => {
  describe('Rendering', () => {
    it('renders as an input element', () => {
      render(<Input />)

      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('renders with placeholder', () => {
      render(<Input placeholder="Enter text" />)

      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
    })

    it('renders with value', () => {
      render(<Input value="Test value" onChange={() => {}} />)

      expect(screen.getByRole('textbox')).toHaveValue('Test value')
    })

    it('applies custom className', () => {
      render(<Input className="custom-class" />)

      expect(screen.getByRole('textbox')).toHaveClass('custom-class')
    })
  })

  describe('Input Types', () => {
    it('defaults to text type', () => {
      render(<Input />)

      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text')
    })

    it('accepts email type', () => {
      render(<Input type="email" />)

      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email')
    })

    it('accepts password type', () => {
      const { container } = render(<Input type="password" />)

      expect(container.querySelector('input')).toHaveAttribute('type', 'password')
    })

    it('accepts number type', () => {
      const { container } = render(<Input type="number" />)

      expect(container.querySelector('input')).toHaveAttribute('type', 'number')
    })

    it('accepts url type', () => {
      render(<Input type="url" />)

      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'url')
    })

    it('accepts search type', () => {
      render(<Input type="search" />)

      expect(screen.getByRole('searchbox')).toHaveAttribute('type', 'search')
    })

    it('accepts tel type', () => {
      render(<Input type="tel" />)

      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'tel')
    })
  })

  describe('Variants', () => {
    it('applies default variant by default', () => {
      render(<Input />)

      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('border-border', 'focus:border-primary', 'focus:ring-primary/50')
    })

    it('applies primary variant', () => {
      render(<Input variant="primary" />)

      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('border-primary', 'focus:ring-primary/50')
    })

    it('applies error variant', () => {
      render(<Input variant="error" />)

      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('border-destructive', 'focus:ring-destructive/50')
    })

    it('applies success variant', () => {
      render(<Input variant="success" />)

      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('border-green-500', 'focus:ring-green-500/50')
    })
  })

  describe('Sizes', () => {
    it('applies medium size by default', () => {
      render(<Input />)

      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('px-4', 'py-2', 'text-sm')
    })

    it('applies small size', () => {
      render(<Input size="sm" />)

      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('px-3', 'py-1.5', 'text-xs')
    })

    it('applies large size', () => {
      render(<Input size="lg" />)

      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('px-6', 'py-3', 'text-base')
    })
  })

  describe('Form Attributes', () => {
    it('accepts name attribute', () => {
      render(<Input name="username" />)

      expect(screen.getByRole('textbox')).toHaveAttribute('name', 'username')
    })

    it('accepts id attribute', () => {
      render(<Input id="email-input" />)

      expect(screen.getByRole('textbox')).toHaveAttribute('id', 'email-input')
    })

    it('accepts required attribute', () => {
      render(<Input required />)

      expect(screen.getByRole('textbox')).toBeRequired()
    })

    it('is not required by default', () => {
      render(<Input />)

      expect(screen.getByRole('textbox')).not.toBeRequired()
    })
  })

  describe('Disabled State', () => {
    it('is not disabled by default', () => {
      render(<Input />)

      expect(screen.getByRole('textbox')).not.toBeDisabled()
    })

    it('can be disabled', () => {
      render(<Input disabled />)

      expect(screen.getByRole('textbox')).toBeDisabled()
    })

    it('applies disabled styles when disabled', () => {
      render(<Input disabled />)

      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed')
    })
  })

  describe('Auto Focus', () => {
    it('does not auto focus by default', () => {
      render(<Input />)

      expect(screen.getByRole('textbox')).not.toHaveFocus()
    })

    it('auto focuses when autoFocus is true', () => {
      render(<Input autoFocus />)

      expect(screen.getByRole('textbox')).toHaveFocus()
    })
  })

  describe('onChange Handler', () => {
    it('calls onChange handler when value changes', () => {
      const onChange = vi.fn()
      render(<Input onChange={onChange} />)

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'new value' } })

      expect(onChange).toHaveBeenCalledTimes(1)
    })

    it('passes event to onChange handler', () => {
      const onChange = vi.fn()
      render(<Input onChange={onChange} />)

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'test' } })

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({
            value: 'test'
          })
        })
      )
    })
  })

  describe('Combined Features', () => {
    it('combines variant and size', () => {
      render(<Input variant="error" size="lg" />)

      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('border-destructive') // error variant
      expect(input).toHaveClass('px-6', 'py-3') // large size
    })

    it('combines all props', () => {
      const onChange = vi.fn()
      render(
        <Input
          type="email"
          variant="primary"
          size="sm"
          placeholder="Email"
          name="email"
          id="email-input"
          required
          onChange={onChange}
        />
      )

      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'email')
      expect(input).toHaveClass('border-primary') // primary variant
      expect(input).toHaveClass('px-3', 'py-1.5') // small size
      expect(input).toHaveAttribute('placeholder', 'Email')
      expect(input).toHaveAttribute('name', 'email')
      expect(input).toHaveAttribute('id', 'email-input')
      expect(input).toBeRequired()
    })
  })

  describe('Styling', () => {
    it('has base styles', () => {
      render(<Input />)

      const input = screen.getByRole('textbox')
      expect(input).toHaveClass(
        'w-full',
        'rounded',
        'border',
        'bg-background',
        'transition-all',
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-offset-2'
      )
    })

    it('has full width', () => {
      render(<Input />)

      expect(screen.getByRole('textbox')).toHaveClass('w-full')
    })
  })

  describe('Accessibility', () => {
    it('has proper role', () => {
      render(<Input />)

      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('can receive keyboard focus', () => {
      render(<Input />)

      const input = screen.getByRole('textbox')
      input.focus()

      expect(document.activeElement).toBe(input)
    })

    it('cannot receive keyboard focus when disabled', () => {
      render(<Input disabled />)

      const input = screen.getByRole('textbox')
      input.focus()

      expect(document.activeElement).not.toBe(input)
    })

    it('shows focus ring on focus', () => {
      render(<Input />)

      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('focus:ring-2')
    })
  })

  describe('Controlled vs Uncontrolled', () => {
    it('works as uncontrolled component', () => {
      render(<Input />)

      const input = screen.getByRole('textbox') as HTMLInputElement
      fireEvent.change(input, { target: { value: 'test' } })

      expect(input.value).toBe('test')
    })

    it('works as controlled component', () => {
      const onChange = vi.fn()
      const { rerender } = render(<Input value="initial" onChange={onChange} />)

      const input = screen.getByRole('textbox') as HTMLInputElement
      expect(input.value).toBe('initial')

      fireEvent.change(input, { target: { value: 'updated' } })
      expect(onChange).toHaveBeenCalled()

      rerender(<Input value="updated" onChange={onChange} />)
      expect(input.value).toBe('updated')
    })
  })
})
