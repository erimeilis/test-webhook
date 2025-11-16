/**
 * Badge Component Tests
 * Unit tests for the badge/chip component with variant support
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Badge } from '@/components/ui/Badge'

describe('Badge', () => {
  describe('Rendering', () => {
    it('renders with children text', () => {
      render(<Badge>Test Badge</Badge>)

      expect(screen.getByText('Test Badge')).toBeInTheDocument()
    })

    it('renders as a span element', () => {
      const { container } = render(<Badge>Badge</Badge>)

      const badge = container.querySelector('span')
      expect(badge).toBeInTheDocument()
    })

    it('applies custom className', () => {
      const { container } = render(<Badge className="custom-class">Badge</Badge>)

      const badge = container.querySelector('span')
      expect(badge).toHaveClass('custom-class')
    })

    it('forwards HTML attributes', () => {
      render(<Badge data-testid="custom-badge">Badge</Badge>)

      expect(screen.getByTestId('custom-badge')).toBeInTheDocument()
    })
  })

  describe('Variants', () => {
    it('applies default variant by default', () => {
      const { container } = render(<Badge>Default</Badge>)

      const badge = container.querySelector('span')
      expect(badge).toHaveClass('bg-blue-500/15', 'text-blue-700', 'border-blue-500/30')
    })

    it('applies secondary variant', () => {
      const { container } = render(<Badge variant="secondary">Secondary</Badge>)

      const badge = container.querySelector('span')
      expect(badge).toHaveClass('bg-gray-500/15', 'text-gray-700', 'border-gray-500/30')
    })

    it('applies outline variant', () => {
      const { container } = render(<Badge variant="outline">Outline</Badge>)

      const badge = container.querySelector('span')
      expect(badge).toHaveClass('bg-transparent', 'text-foreground', 'border-border')
    })

    it('applies success variant', () => {
      const { container } = render(<Badge variant="success">Success</Badge>)

      const badge = container.querySelector('span')
      expect(badge).toHaveClass('bg-green-500/15', 'text-green-700', 'border-green-500/30')
    })

    it('applies warning variant', () => {
      const { container } = render(<Badge variant="warning">Warning</Badge>)

      const badge = container.querySelector('span')
      expect(badge).toHaveClass('bg-yellow-500/15', 'text-yellow-700', 'border-yellow-500/30')
    })

    it('applies error variant', () => {
      const { container } = render(<Badge variant="error">Error</Badge>)

      const badge = container.querySelector('span')
      expect(badge).toHaveClass('bg-red-500/15', 'text-red-700', 'border-red-500/30')
    })
  })

  describe('Sizes', () => {
    it('applies medium size by default', () => {
      const { container } = render(<Badge>Medium</Badge>)

      const badge = container.querySelector('span')
      expect(badge).toHaveClass('px-2.5', 'py-0.5', 'text-sm')
    })

    it('applies small size', () => {
      const { container } = render(<Badge size="sm">Small</Badge>)

      const badge = container.querySelector('span')
      expect(badge).toHaveClass('px-2', 'py-0.5', 'text-xs')
    })

    it('applies large size', () => {
      const { container } = render(<Badge size="lg">Large</Badge>)

      const badge = container.querySelector('span')
      expect(badge).toHaveClass('px-3', 'py-1', 'text-sm')
    })
  })

  describe('Clickable Behavior', () => {
    it('is not clickable by default', () => {
      const { container } = render(<Badge>Not Clickable</Badge>)

      const badge = container.querySelector('span')
      expect(badge).not.toHaveClass('cursor-pointer')
      expect(badge).not.toHaveAttribute('role')
      expect(badge).not.toHaveAttribute('tabIndex')
    })

    it('becomes clickable when clickable prop is true', () => {
      const { container } = render(<Badge clickable>Clickable</Badge>)

      const badge = container.querySelector('span')
      expect(badge).toHaveClass('cursor-pointer')
      expect(badge).toHaveAttribute('role', 'button')
      expect(badge).toHaveAttribute('tabIndex', '0')
    })

    it('becomes clickable when onClick is provided', () => {
      const onClick = vi.fn()
      const { container } = render(<Badge onClick={onClick}>Clickable</Badge>)

      const badge = container.querySelector('span')
      expect(badge).toHaveClass('cursor-pointer')
      expect(badge).toHaveAttribute('role', 'button')
      expect(badge).toHaveAttribute('tabIndex', '0')
    })

    it('calls onClick handler when clicked', () => {
      const onClick = vi.fn()
      const { container } = render(<Badge onClick={onClick}>Click Me</Badge>)

      const badge = container.querySelector('span')!
      fireEvent.click(badge)

      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('stops propagation when clicked', () => {
      const onClick = vi.fn()
      const parentClick = vi.fn()

      const { container } = render(
        <div onClick={parentClick}>
          <Badge onClick={onClick}>Click Me</Badge>
        </div>
      )

      const badge = container.querySelector('span')!
      fireEvent.click(badge)

      expect(onClick).toHaveBeenCalledTimes(1)
      expect(parentClick).not.toHaveBeenCalled()
    })
  })

  describe('Removable Behavior', () => {
    it('does not show remove button by default', () => {
      render(<Badge>Not Removable</Badge>)

      expect(screen.queryByLabelText('Remove')).not.toBeInTheDocument()
    })

    it('shows remove button when removable is true', () => {
      render(<Badge removable>Removable</Badge>)

      expect(screen.getByLabelText('Remove')).toBeInTheDocument()
    })

    it('calls onRemove handler when remove button is clicked', () => {
      const onRemove = vi.fn()
      render(<Badge removable onRemove={onRemove}>Remove Me</Badge>)

      const removeButton = screen.getByLabelText('Remove')
      fireEvent.click(removeButton)

      expect(onRemove).toHaveBeenCalledTimes(1)
    })

    it('stops propagation when remove button is clicked', () => {
      const onRemove = vi.fn()
      const badgeClick = vi.fn()

      render(
        <Badge removable onRemove={onRemove} onClick={badgeClick}>
          Remove Me
        </Badge>
      )

      const removeButton = screen.getByLabelText('Remove')
      fireEvent.click(removeButton)

      expect(onRemove).toHaveBeenCalledTimes(1)
      expect(badgeClick).not.toHaveBeenCalled()
    })

    it('renders remove button with correct icon', () => {
      render(<Badge removable>Removable</Badge>)

      const removeButton = screen.getByLabelText('Remove')
      const svg = removeButton.querySelector('svg')

      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute('width', '12')
      expect(svg).toHaveAttribute('height', '12')
    })
  })

  describe('Combined Features', () => {
    it('can be both clickable and removable', () => {
      const onClick = vi.fn()
      const onRemove = vi.fn()

      render(
        <Badge clickable removable onClick={onClick} onRemove={onRemove}>
          Full Featured
        </Badge>
      )

      const { container } = render(
        <Badge clickable removable onClick={onClick} onRemove={onRemove}>
          Full Featured
        </Badge>
      )

      const badge = container.querySelector('span')
      expect(badge).toHaveClass('cursor-pointer')
      expect(screen.getByLabelText('Remove')).toBeInTheDocument()
    })

    it('combines variant, size, and clickable', () => {
      const onClick = vi.fn()
      const { container } = render(
        <Badge variant="success" size="lg" clickable onClick={onClick}>
          Combined
        </Badge>
      )

      const badge = container.querySelector('span')
      expect(badge).toHaveClass('bg-green-500/15') // success variant
      expect(badge).toHaveClass('px-3', 'py-1') // large size
      expect(badge).toHaveClass('cursor-pointer') // clickable
    })
  })

  describe('Accessibility', () => {
    it('has button role when clickable', () => {
      const { container } = render(<Badge clickable>Accessible</Badge>)

      const badge = container.querySelector('span')
      expect(badge).toHaveAttribute('role', 'button')
    })

    it('is keyboard accessible when clickable', () => {
      const { container } = render(<Badge clickable>Accessible</Badge>)

      const badge = container.querySelector('span')
      expect(badge).toHaveAttribute('tabIndex', '0')
    })

    it('remove button has accessible label', () => {
      render(<Badge removable>Removable</Badge>)

      const removeButton = screen.getByLabelText('Remove')
      expect(removeButton).toHaveAttribute('type', 'button')
      expect(removeButton).toHaveAttribute('aria-label', 'Remove')
    })
  })
})
