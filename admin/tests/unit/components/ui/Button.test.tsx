/**
 * Button Component Tests
 * Unit tests for the professional button component with CVA variants
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/Button'

// Mock icon component for testing
const MockIcon = ({ size }: { size?: number }) => (
  <svg data-testid="mock-icon" width={size} height={size}>
    <circle cx="12" cy="12" r="10" />
  </svg>
)

describe('Button', () => {
  describe('Rendering', () => {
    it('renders with children text', () => {
      render(<Button>Click Me</Button>)

      expect(screen.getByRole('button')).toHaveTextContent('Click Me')
    })

    it('renders as a button element', () => {
      render(<Button>Button</Button>)

      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      render(<Button className="custom-class">Button</Button>)

      expect(screen.getByRole('button')).toHaveClass('custom-class')
    })

    it('forwards HTML attributes', () => {
      render(<Button data-testid="custom-button">Button</Button>)

      expect(screen.getByTestId('custom-button')).toBeInTheDocument()
    })
  })

  describe('Color Variants', () => {
    it('applies primary color', () => {
      const { container } = render(<Button color="primary">Primary</Button>)

      expect(container.querySelector('button')).toHaveClass('btn-primary')
    })

    it('applies secondary color', () => {
      const { container } = render(<Button color="secondary">Secondary</Button>)

      expect(container.querySelector('button')).toHaveClass('btn-secondary')
    })

    it('applies success color', () => {
      const { container } = render(<Button color="success">Success</Button>)

      expect(container.querySelector('button')).toHaveClass('btn-success')
    })

    it('applies error color', () => {
      const { container } = render(<Button color="error">Error</Button>)

      expect(container.querySelector('button')).toHaveClass('btn-error')
    })
  })

  describe('Style Variants', () => {
    it('applies solid style', () => {
      const { container } = render(<Button style="solid">Solid</Button>)

      expect(container.querySelector('button')).toHaveClass('btn-solid')
    })

    it('applies soft style', () => {
      const { container } = render(<Button style="soft">Soft</Button>)

      expect(container.querySelector('button')).toHaveClass('btn-soft')
    })

    it('applies outline style', () => {
      const { container } = render(<Button style="outline">Outline</Button>)

      expect(container.querySelector('button')).toHaveClass('btn-outline')
    })

    it('applies ghost style', () => {
      const { container } = render(<Button style="ghost">Ghost</Button>)

      expect(container.querySelector('button')).toHaveClass('btn-ghost')
    })
  })

  describe('Size Variants', () => {
    it('applies extra small size', () => {
      const { container } = render(<Button size="xs">XS</Button>)

      expect(container.querySelector('button')).toHaveClass('btn-xs')
    })

    it('applies small size', () => {
      const { container } = render(<Button size="sm">Small</Button>)

      expect(container.querySelector('button')).toHaveClass('btn-sm')
    })

    it('applies medium size', () => {
      const { container } = render(<Button size="md">Medium</Button>)

      expect(container.querySelector('button')).toHaveClass('btn-md')
    })

    it('applies large size', () => {
      const { container } = render(<Button size="lg">Large</Button>)

      expect(container.querySelector('button')).toHaveClass('btn-lg')
    })

    it('applies extra large size', () => {
      const { container } = render(<Button size="xl">XL</Button>)

      expect(container.querySelector('button')).toHaveClass('btn-xl')
    })
  })

  describe('Modifier Variants', () => {
    it('applies wide modifier', () => {
      const { container } = render(<Button modifier="wide">Wide</Button>)

      expect(container.querySelector('button')).toHaveClass('btn-wide')
    })

    it('applies full modifier', () => {
      const { container } = render(<Button modifier="full">Full</Button>)

      expect(container.querySelector('button')).toHaveClass('btn-full')
    })

    it('applies square modifier', () => {
      const { container } = render(<Button modifier="square">[]</Button>)

      expect(container.querySelector('button')).toHaveClass('btn-square')
    })

    it('applies circle modifier', () => {
      const { container } = render(<Button modifier="circle">O</Button>)

      expect(container.querySelector('button')).toHaveClass('btn-circle')
    })
  })

  describe('Processing State', () => {
    it('shows loading spinner when processing', () => {
      render(<Button processing>Processing</Button>)

      const spinner = screen.getByRole('button').querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('is disabled when processing', () => {
      render(<Button processing>Processing</Button>)

      expect(screen.getByRole('button')).toBeDisabled()
    })

    it('applies disabled behaviour when processing', () => {
      const { container } = render(<Button processing>Processing</Button>)

      expect(container.querySelector('button')).toHaveClass('btn-disabled')
    })

    it('hides prefix icon when processing', () => {
      render(<Button processing prefixIcon={MockIcon}>Processing</Button>)

      expect(screen.queryByTestId('mock-icon')).not.toBeInTheDocument()
    })

    it('hides postfix icon when processing', () => {
      render(<Button processing postfixIcon={MockIcon}>Processing</Button>)

      expect(screen.queryByTestId('mock-icon')).not.toBeInTheDocument()
    })
  })

  describe('Success State', () => {
    it('shows success icon when success is true', () => {
      const { container } = render(<Button success>Success</Button>)

      const successIcon = container.querySelector('svg path[d="M20 6L9 17L4 12"]')
      expect(successIcon).toBeInTheDocument()
    })

    it('changes to success color when success is true', () => {
      const { container } = render(<Button color="primary" success>Success</Button>)

      expect(container.querySelector('button')).toHaveClass('btn-success')
    })

    it('changes to soft style when success is true', () => {
      const { container } = render(<Button style="solid" success>Success</Button>)

      expect(container.querySelector('button')).toHaveClass('btn-soft')
    })

    it('hides prefix icon when success is true', () => {
      render(<Button success prefixIcon={MockIcon}>Success</Button>)

      expect(screen.queryByTestId('mock-icon')).not.toBeInTheDocument()
    })
  })

  describe('Fail State', () => {
    it('shows fail icon when fail is true', () => {
      const { container } = render(<Button fail>Failed</Button>)

      const failIcon = container.querySelector('svg path[d="M18 6L6 18M6 6L18 18"]')
      expect(failIcon).toBeInTheDocument()
    })

    it('changes to error color when fail is true', () => {
      const { container } = render(<Button color="primary" fail>Failed</Button>)

      expect(container.querySelector('button')).toHaveClass('btn-error')
    })

    it('changes to soft style when fail is true', () => {
      const { container } = render(<Button style="solid" fail>Failed</Button>)

      expect(container.querySelector('button')).toHaveClass('btn-soft')
    })

    it('hides postfix icon when fail is true', () => {
      render(<Button fail postfixIcon={MockIcon}>Failed</Button>)

      expect(screen.queryByTestId('mock-icon')).not.toBeInTheDocument()
    })
  })

  describe('Icon Support', () => {
    it('renders prefix icon', () => {
      render(<Button prefixIcon={MockIcon}>With Icon</Button>)

      expect(screen.getByTestId('mock-icon')).toBeInTheDocument()
    })

    it('renders postfix icon', () => {
      render(<Button postfixIcon={MockIcon}>With Icon</Button>)

      expect(screen.getByTestId('mock-icon')).toBeInTheDocument()
    })

    it('renders both prefix and postfix icons', () => {
      render(<Button prefixIcon={MockIcon} postfixIcon={MockIcon}>Both Icons</Button>)

      const icons = screen.getAllByTestId('mock-icon')
      expect(icons).toHaveLength(2)
    })

    it('adjusts icon size for xs button', () => {
      render(<Button size="xs" prefixIcon={MockIcon}>XS</Button>)

      const icon = screen.getByTestId('mock-icon')
      expect(icon).toHaveAttribute('width', '12')
      expect(icon).toHaveAttribute('height', '12')
    })

    it('adjusts icon size for sm button', () => {
      render(<Button size="sm" prefixIcon={MockIcon}>Small</Button>)

      const icon = screen.getByTestId('mock-icon')
      expect(icon).toHaveAttribute('width', '14')
      expect(icon).toHaveAttribute('height', '14')
    })

    it('adjusts icon size for md button', () => {
      render(<Button size="md" prefixIcon={MockIcon}>Medium</Button>)

      const icon = screen.getByTestId('mock-icon')
      expect(icon).toHaveAttribute('width', '16')
      expect(icon).toHaveAttribute('height', '16')
    })

    it('adjusts icon size for lg button', () => {
      render(<Button size="lg" prefixIcon={MockIcon}>Large</Button>)

      const icon = screen.getByTestId('mock-icon')
      expect(icon).toHaveAttribute('width', '18')
      expect(icon).toHaveAttribute('height', '18')
    })

    it('adjusts icon size for xl button', () => {
      render(<Button size="xl" prefixIcon={MockIcon}>XL</Button>)

      const icon = screen.getByTestId('mock-icon')
      expect(icon).toHaveAttribute('width', '20')
      expect(icon).toHaveAttribute('height', '20')
    })
  })

  describe('Disabled State', () => {
    it('is disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>)

      expect(screen.getByRole('button')).toBeDisabled()
    })

    it('applies disabled behaviour', () => {
      const { container } = render(<Button disabled>Disabled</Button>)

      expect(container.querySelector('button')).toHaveClass('btn-disabled')
    })

    it('does not call onClick when disabled', () => {
      const onClick = vi.fn()
      render(<Button disabled onClick={onClick}>Disabled</Button>)

      fireEvent.click(screen.getByRole('button'))

      expect(onClick).not.toHaveBeenCalled()
    })
  })

  describe('Click Handling', () => {
    it('calls onClick handler when clicked', () => {
      const onClick = vi.fn()
      render(<Button onClick={onClick}>Click Me</Button>)

      fireEvent.click(screen.getByRole('button'))

      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('does not have onClick when not provided', () => {
      const { container } = render(<Button>No Handler</Button>)

      const button = container.querySelector('button')
      expect(button).not.toHaveProperty('onClick')
    })
  })

  describe('Combined Variants', () => {
    it('combines color, style, and size', () => {
      const { container } = render(
        <Button color="primary" style="soft" size="lg">
          Combined
        </Button>
      )

      const button = container.querySelector('button')
      expect(button).toHaveClass('btn-primary', 'btn-soft', 'btn-lg')
    })

    it('combines all variant types', () => {
      const { container } = render(
        <Button color="success" style="outline" size="md" modifier="wide">
          All Variants
        </Button>
      )

      const button = container.querySelector('button')
      expect(button).toHaveClass('btn-success', 'btn-outline', 'btn-md', 'btn-wide')
    })
  })

  describe('State Priority', () => {
    it('success state overrides color', () => {
      const { container } = render(<Button color="primary" success>Success</Button>)

      expect(container.querySelector('button')).toHaveClass('btn-success')
    })

    it('fail state overrides color', () => {
      const { container } = render(<Button color="primary" fail>Failed</Button>)

      expect(container.querySelector('button')).toHaveClass('btn-error')
    })

    it('processing overrides disabled', () => {
      render(<Button disabled processing>Processing</Button>)

      expect(screen.getByRole('button')).toBeDisabled()
    })

    it('fail takes priority over success', () => {
      const { container } = render(<Button success fail>Failed</Button>)

      expect(container.querySelector('button')).toHaveClass('btn-error')
    })
  })

  describe('Accessibility', () => {
    it('has button role', () => {
      render(<Button>Accessible</Button>)

      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('can receive keyboard focus when not disabled', () => {
      render(<Button>Focusable</Button>)

      const button = screen.getByRole('button')
      button.focus()

      expect(document.activeElement).toBe(button)
    })

    it('cannot receive keyboard focus when disabled', () => {
      render(<Button disabled>Not Focusable</Button>)

      const button = screen.getByRole('button')
      button.focus()

      expect(document.activeElement).not.toBe(button)
    })
  })
})
