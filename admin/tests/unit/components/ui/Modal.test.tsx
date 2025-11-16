/**
 * Modal Component Tests
 * Unit tests for the modal dialog component
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Modal } from '@/components/ui/Modal'

describe('Modal', () => {
  describe('Rendering', () => {
    it('renders when isOpen is true', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      )

      expect(screen.getByText('Test Modal')).toBeInTheDocument()
      expect(screen.getByText('Modal content')).toBeInTheDocument()
    })

    it('does not render when isOpen is false', () => {
      const { container } = render(
        <Modal isOpen={false} onClose={() => {}} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      )

      expect(container.firstChild).toBeNull()
    })

    it('renders title in header', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Custom Title">
          <p>Content</p>
        </Modal>
      )

      expect(screen.getByText('Custom Title')).toBeInTheDocument()
    })

    it('renders children content', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Modal">
          <div>
            <p>First paragraph</p>
            <p>Second paragraph</p>
          </div>
        </Modal>
      )

      expect(screen.getByText('First paragraph')).toBeInTheDocument()
      expect(screen.getByText('Second paragraph')).toBeInTheDocument()
    })

    it('renders actions when provided', () => {
      render(
        <Modal
          isOpen={true}
          onClose={() => {}}
          title="Modal"
          actions={
            <>
              <button>Cancel</button>
              <button>Confirm</button>
            </>
          }
        >
          <p>Content</p>
        </Modal>
      )

      expect(screen.getByText('Cancel')).toBeInTheDocument()
      expect(screen.getByText('Confirm')).toBeInTheDocument()
    })

    it('does not render actions footer when actions not provided', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}} title="Modal">
          <p>Content</p>
        </Modal>
      )

      const footer = container.querySelector('.border-t')
      expect(footer).not.toBeInTheDocument()
    })
  })

  describe('Close Button', () => {
    it('renders close button in header', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Modal">
          <p>Content</p>
        </Modal>
      )

      expect(screen.getByLabelText('Close modal')).toBeInTheDocument()
    })

    it('calls onClose when close button clicked', () => {
      const onClose = vi.fn()
      render(
        <Modal isOpen={true} onClose={onClose} title="Modal">
          <p>Content</p>
        </Modal>
      )

      fireEvent.click(screen.getByLabelText('Close modal'))
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('close button has proper accessibility', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Modal">
          <p>Content</p>
        </Modal>
      )

      const closeButton = screen.getByLabelText('Close modal')
      expect(closeButton).toHaveAttribute('aria-label', 'Close modal')
    })
  })

  describe('Backdrop Behavior', () => {
    it('renders backdrop', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}} title="Modal">
          <p>Content</p>
        </Modal>
      )

      const backdrop = container.querySelector('.bg-black\\/50')
      expect(backdrop).toBeInTheDocument()
    })

    it('calls onClose when backdrop clicked', () => {
      const onClose = vi.fn()
      const { container } = render(
        <Modal isOpen={true} onClose={onClose} title="Modal">
          <p>Content</p>
        </Modal>
      )

      const overlay = container.querySelector('.fixed.inset-0')!
      fireEvent.click(overlay)

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('backdrop has blur effect', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}} title="Modal">
          <p>Content</p>
        </Modal>
      )

      const backdrop = container.querySelector('.backdrop-blur-sm')
      expect(backdrop).toBeInTheDocument()
    })
  })

  describe('Modal Dialog Behavior', () => {
    it('does not close when modal content clicked', () => {
      const onClose = vi.fn()
      render(
        <Modal isOpen={true} onClose={onClose} title="Modal">
          <p>Modal content</p>
        </Modal>
      )

      fireEvent.click(screen.getByText('Modal content'))
      expect(onClose).not.toHaveBeenCalled()
    })

    it('does not close when title clicked', () => {
      const onClose = vi.fn()
      render(
        <Modal isOpen={true} onClose={onClose} title="Modal Title">
          <p>Content</p>
        </Modal>
      )

      fireEvent.click(screen.getByText('Modal Title'))
      expect(onClose).not.toHaveBeenCalled()
    })

    it('does not close when actions clicked', () => {
      const onClose = vi.fn()
      render(
        <Modal
          isOpen={true}
          onClose={onClose}
          title="Modal"
          actions={<button>Action</button>}
        >
          <p>Content</p>
        </Modal>
      )

      fireEvent.click(screen.getByText('Action'))
      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('Styling', () => {
    it('modal has fixed positioning', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}} title="Modal">
          <p>Content</p>
        </Modal>
      )

      const overlay = container.querySelector('.fixed')
      expect(overlay).toHaveClass('inset-0', 'z-50')
    })

    it('modal is centered', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}} title="Modal">
          <p>Content</p>
        </Modal>
      )

      const overlay = container.querySelector('.fixed')
      expect(overlay).toHaveClass('flex', 'items-center', 'justify-center')
    })

    it('modal dialog has card background', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}} title="Modal">
          <p>Content</p>
        </Modal>
      )

      const dialog = container.querySelector('.bg-card')
      expect(dialog).toBeInTheDocument()
    })

    it('modal dialog has border', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}} title="Modal">
          <p>Content</p>
        </Modal>
      )

      const dialog = container.querySelector('.border-border')
      expect(dialog).toBeInTheDocument()
    })

    it('modal dialog has rounded corners', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}} title="Modal">
          <p>Content</p>
        </Modal>
      )

      const dialog = container.querySelector('.rounded-lg')
      expect(dialog).toBeInTheDocument()
    })

    it('modal dialog has shadow', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}} title="Modal">
          <p>Content</p>
        </Modal>
      )

      const dialog = container.querySelector('.shadow-xl')
      expect(dialog).toBeInTheDocument()
    })

    it('modal dialog has max width', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}} title="Modal">
          <p>Content</p>
        </Modal>
      )

      const dialog = container.querySelector('.max-w-2xl')
      expect(dialog).toBeInTheDocument()
    })

    it('modal dialog has responsive width', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}} title="Modal">
          <p>Content</p>
        </Modal>
      )

      const dialog = container.querySelector('.w-full')
      expect(dialog).toBeInTheDocument()
    })

    it('modal dialog has horizontal margins', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}} title="Modal">
          <p>Content</p>
        </Modal>
      )

      const dialog = container.querySelector('.mx-4')
      expect(dialog).toBeInTheDocument()
    })
  })

  describe('Header Styling', () => {
    it('header has border bottom', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}} title="Modal">
          <p>Content</p>
        </Modal>
      )

      const header = container.querySelector('.border-b')
      expect(header).toBeInTheDocument()
    })

    it('header has padding', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}} title="Modal">
          <p>Content</p>
        </Modal>
      )

      const header = container.querySelector('.p-6.border-b')
      expect(header).toBeInTheDocument()
    })

    it('title has proper styling', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Modal Title">
          <p>Content</p>
        </Modal>
      )

      const title = screen.getByText('Modal Title')
      expect(title).toHaveClass('text-xl', 'font-semibold', 'text-foreground')
    })

    it('close button has hover effect', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Modal">
          <p>Content</p>
        </Modal>
      )

      const closeButton = screen.getByLabelText('Close modal')
      expect(closeButton).toHaveClass('hover:bg-accent')
    })
  })

  describe('Content Section', () => {
    it('content has padding', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}} title="Modal">
          <p>Content</p>
        </Modal>
      )

      const contentSections = container.querySelectorAll('.p-6')
      expect(contentSections.length).toBeGreaterThan(0)
    })

    it('renders complex children', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Modal">
          <div>
            <h3>Subheading</h3>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </div>
        </Modal>
      )

      expect(screen.getByText('Subheading')).toBeInTheDocument()
      expect(screen.getByText('Item 1')).toBeInTheDocument()
      expect(screen.getByText('Item 2')).toBeInTheDocument()
    })
  })

  describe('Actions Footer', () => {
    it('footer has border top when actions present', () => {
      const { container } = render(
        <Modal
          isOpen={true}
          onClose={() => {}}
          title="Modal"
          actions={<button>Action</button>}
        >
          <p>Content</p>
        </Modal>
      )

      const footer = container.querySelector('.border-t')
      expect(footer).toBeInTheDocument()
    })

    it('footer is right-aligned', () => {
      const { container } = render(
        <Modal
          isOpen={true}
          onClose={() => {}}
          title="Modal"
          actions={<button>Action</button>}
        >
          <p>Content</p>
        </Modal>
      )

      const footer = container.querySelector('.justify-end')
      expect(footer).toBeInTheDocument()
    })

    it('footer has gap between actions', () => {
      const { container } = render(
        <Modal
          isOpen={true}
          onClose={() => {}}
          title="Modal"
          actions={<button>Action</button>}
        >
          <p>Content</p>
        </Modal>
      )

      const footer = container.querySelector('.gap-3')
      expect(footer).toBeInTheDocument()
    })

    it('footer has padding', () => {
      const { container } = render(
        <Modal
          isOpen={true}
          onClose={() => {}}
          title="Modal"
          actions={<button>Action</button>}
        >
          <p>Content</p>
        </Modal>
      )

      const footer = container.querySelector('.p-6.border-t')
      expect(footer).toBeInTheDocument()
    })

    it('renders multiple actions', () => {
      render(
        <Modal
          isOpen={true}
          onClose={() => {}}
          title="Modal"
          actions={
            <>
              <button>Cancel</button>
              <button>Save</button>
              <button>Delete</button>
            </>
          }
        >
          <p>Content</p>
        </Modal>
      )

      expect(screen.getByText('Cancel')).toBeInTheDocument()
      expect(screen.getByText('Save')).toBeInTheDocument()
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })
  })

  describe('Z-Index Layering', () => {
    it('overlay has high z-index', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}} title="Modal">
          <p>Content</p>
        </Modal>
      )

      const overlay = container.querySelector('.z-50')
      expect(overlay).toBeInTheDocument()
    })

    it('backdrop is behind modal', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}} title="Modal">
          <p>Content</p>
        </Modal>
      )

      const backdrop = container.querySelector('.absolute.inset-0')
      expect(backdrop).toBeInTheDocument()
    })

    it('modal dialog is above backdrop', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}} title="Modal">
          <p>Content</p>
        </Modal>
      )

      const dialog = container.querySelector('.relative.z-10')
      expect(dialog).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('title is a heading', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Modal Title">
          <p>Content</p>
        </Modal>
      )

      const title = screen.getByText('Modal Title')
      expect(title.tagName).toBe('H2')
    })

    it('close button is a button element', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Modal">
          <p>Content</p>
        </Modal>
      )

      const closeButton = screen.getByLabelText('Close modal')
      expect(closeButton.tagName).toBe('BUTTON')
    })

    it('close button has aria-label', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Modal">
          <p>Content</p>
        </Modal>
      )

      const closeButton = screen.getByLabelText('Close modal')
      expect(closeButton).toHaveAttribute('aria-label', 'Close modal')
    })
  })

  describe('Combined Features', () => {
    it('combines all features correctly', () => {
      const onClose = vi.fn()
      render(
        <Modal
          isOpen={true}
          onClose={onClose}
          title="Complete Modal"
          actions={
            <>
              <button>Cancel</button>
              <button>Confirm</button>
            </>
          }
        >
          <div>
            <p>Modal body content</p>
            <p>Multiple paragraphs</p>
          </div>
        </Modal>
      )

      // Title
      expect(screen.getByText('Complete Modal')).toBeInTheDocument()

      // Content
      expect(screen.getByText('Modal body content')).toBeInTheDocument()
      expect(screen.getByText('Multiple paragraphs')).toBeInTheDocument()

      // Actions
      expect(screen.getByText('Cancel')).toBeInTheDocument()
      expect(screen.getByText('Confirm')).toBeInTheDocument()

      // Close button
      expect(screen.getByLabelText('Close modal')).toBeInTheDocument()

      // Close functionality
      fireEvent.click(screen.getByLabelText('Close modal'))
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })
})
