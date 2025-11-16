/**
 * TagsInput Component Tests
 * Unit tests for the tags input with chip-style visualization
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TagsInput } from '@/components/ui/TagsInput'

describe('TagsInput', () => {
  describe('Rendering', () => {
    it('renders with empty value', () => {
      render(<TagsInput value={[]} onChange={() => {}} />)

      const input = screen.getByPlaceholderText('Add tags...')
      expect(input).toBeInTheDocument()
    })

    it('renders with existing tags', () => {
      render(<TagsInput value={['tag1', 'tag2']} onChange={() => {}} />)

      expect(screen.getByText('tag1')).toBeInTheDocument()
      expect(screen.getByText('tag2')).toBeInTheDocument()
    })

    it('renders with custom placeholder', () => {
      render(<TagsInput value={[]} onChange={() => {}} placeholder="Custom placeholder" />)

      expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument()
    })

    it('hides placeholder when tags exist', () => {
      render(<TagsInput value={['tag1']} onChange={() => {}} placeholder="Add tags..." />)

      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('placeholder', '')
    })

    it('applies custom className', () => {
      const { container } = render(
        <TagsInput value={[]} onChange={() => {}} className="custom-class" />
      )

      const wrapper = container.querySelector('.custom-class')
      expect(wrapper).toBeInTheDocument()
    })

    it('accepts id attribute', () => {
      render(<TagsInput value={[]} onChange={() => {}} id="tags-input" />)

      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('id', 'tags-input')
    })
  })

  describe('Tag Addition', () => {
    it('adds tag on Enter key', () => {
      const onChange = vi.fn()
      render(<TagsInput value={[]} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'newtag' } })
      fireEvent.keyDown(input, { key: 'Enter' })

      expect(onChange).toHaveBeenCalledWith(['newtag'])
    })

    it('adds tag on comma key', () => {
      const onChange = vi.fn()
      render(<TagsInput value={[]} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'newtag' } })
      fireEvent.keyDown(input, { key: ',' })

      expect(onChange).toHaveBeenCalledWith(['newtag'])
    })

    it('adds tag on blur', () => {
      const onChange = vi.fn()
      render(<TagsInput value={[]} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'newtag' } })
      fireEvent.blur(input)

      expect(onChange).toHaveBeenCalledWith(['newtag'])
    })

    it('trims whitespace from tags', () => {
      const onChange = vi.fn()
      render(<TagsInput value={[]} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: '  newtag  ' } })
      fireEvent.keyDown(input, { key: 'Enter' })

      expect(onChange).toHaveBeenCalledWith(['newtag'])
    })

    it('does not add empty tags', () => {
      const onChange = vi.fn()
      render(<TagsInput value={[]} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: '   ' } })
      fireEvent.keyDown(input, { key: 'Enter' })

      expect(onChange).not.toHaveBeenCalled()
    })

    it('prevents duplicate tags', () => {
      const onChange = vi.fn()
      render(<TagsInput value={['existing']} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'existing' } })
      fireEvent.keyDown(input, { key: 'Enter' })

      expect(onChange).not.toHaveBeenCalled()
    })

    it('adds tag to existing tags', () => {
      const onChange = vi.fn()
      render(<TagsInput value={['tag1', 'tag2']} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'tag3' } })
      fireEvent.keyDown(input, { key: 'Enter' })

      expect(onChange).toHaveBeenCalledWith(['tag1', 'tag2', 'tag3'])
    })
  })

  describe('Tag Removal', () => {
    it('removes tag when remove button clicked', () => {
      const onChange = vi.fn()
      render(<TagsInput value={['tag1', 'tag2']} onChange={onChange} />)

      const removeButtons = screen.getAllByLabelText('Remove')
      fireEvent.click(removeButtons[0])

      expect(onChange).toHaveBeenCalledWith(['tag2'])
    })

    it('removes last tag on Backspace when input is empty', () => {
      const onChange = vi.fn()
      render(<TagsInput value={['tag1', 'tag2']} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      fireEvent.keyDown(input, { key: 'Backspace' })

      expect(onChange).toHaveBeenCalledWith(['tag1'])
    })

    it('does not remove tag on Backspace when input has value', () => {
      const onChange = vi.fn()
      render(<TagsInput value={['tag1', 'tag2']} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'text' } })
      fireEvent.keyDown(input, { key: 'Backspace' })

      expect(onChange).not.toHaveBeenCalled()
    })

    it('does not remove tag on Backspace when no tags exist', () => {
      const onChange = vi.fn()
      render(<TagsInput value={[]} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      fireEvent.keyDown(input, { key: 'Backspace' })

      expect(onChange).not.toHaveBeenCalled()
    })

    it('removes specific tag by index', () => {
      const onChange = vi.fn()
      render(<TagsInput value={['tag1', 'tag2', 'tag3']} onChange={onChange} />)

      const removeButtons = screen.getAllByLabelText('Remove')
      fireEvent.click(removeButtons[1]) // Remove middle tag

      expect(onChange).toHaveBeenCalledWith(['tag1', 'tag3'])
    })
  })

  describe('Paste Handling', () => {
    it('adds multiple tags from pasted text with commas', () => {
      const onChange = vi.fn()
      render(<TagsInput value={[]} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      fireEvent.paste(input, {
        clipboardData: {
          getData: () => 'tag1,tag2,tag3',
        },
      })

      expect(onChange).toHaveBeenCalledWith(['tag1', 'tag2', 'tag3'])
    })

    it('adds multiple tags from pasted text with semicolons', () => {
      const onChange = vi.fn()
      render(<TagsInput value={[]} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      fireEvent.paste(input, {
        clipboardData: {
          getData: () => 'tag1;tag2;tag3',
        },
      })

      expect(onChange).toHaveBeenCalledWith(['tag1', 'tag2', 'tag3'])
    })

    it('adds multiple tags from pasted text with newlines', () => {
      const onChange = vi.fn()
      render(<TagsInput value={[]} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      fireEvent.paste(input, {
        clipboardData: {
          getData: () => 'tag1\ntag2\ntag3',
        },
      })

      expect(onChange).toHaveBeenCalledWith(['tag1', 'tag2', 'tag3'])
    })

    it('trims whitespace from pasted tags', () => {
      const onChange = vi.fn()
      render(<TagsInput value={[]} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      fireEvent.paste(input, {
        clipboardData: {
          getData: () => '  tag1  ,  tag2  ',
        },
      })

      expect(onChange).toHaveBeenCalledWith(['tag1', 'tag2'])
    })

    it('filters out empty pasted tags', () => {
      const onChange = vi.fn()
      render(<TagsInput value={[]} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      fireEvent.paste(input, {
        clipboardData: {
          getData: () => 'tag1,,tag2,  ,tag3',
        },
      })

      expect(onChange).toHaveBeenCalledWith(['tag1', 'tag2', 'tag3'])
    })

    it('prevents duplicate tags from paste', () => {
      const onChange = vi.fn()
      render(<TagsInput value={['tag1']} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      fireEvent.paste(input, {
        clipboardData: {
          getData: () => 'tag1,tag2,tag3',
        },
      })

      expect(onChange).toHaveBeenCalledWith(['tag1', 'tag2', 'tag3'])
    })

    it('does not call onChange if no new tags to add', () => {
      const onChange = vi.fn()
      render(<TagsInput value={['tag1', 'tag2']} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      fireEvent.paste(input, {
        clipboardData: {
          getData: () => 'tag1,tag2',
        },
      })

      expect(onChange).not.toHaveBeenCalled()
    })
  })

  describe('Input Behavior', () => {
    it('clears input after adding tag', () => {
      render(<TagsInput value={[]} onChange={() => {}} />)

      const input = screen.getByRole('textbox') as HTMLInputElement
      fireEvent.change(input, { target: { value: 'newtag' } })
      fireEvent.keyDown(input, { key: 'Enter' })

      expect(input.value).toBe('')
    })

    it('maintains input value on invalid operations', () => {
      render(<TagsInput value={['existing']} onChange={() => {}} />)

      const input = screen.getByRole('textbox') as HTMLInputElement
      fireEvent.change(input, { target: { value: 'existing' } })
      fireEvent.keyDown(input, { key: 'Enter' })

      expect(input.value).toBe('existing')
    })

    it('updates input value on change', () => {
      render(<TagsInput value={[]} onChange={() => {}} />)

      const input = screen.getByRole('textbox') as HTMLInputElement
      fireEvent.change(input, { target: { value: 'new text' } })

      expect(input.value).toBe('new text')
    })
  })

  describe('Focus Management', () => {
    it('focuses input when container is clicked', () => {
      const { container } = render(<TagsInput value={[]} onChange={() => {}} />)

      const wrapper = container.querySelector('.cursor-text')!
      const input = screen.getByRole('textbox')

      fireEvent.click(wrapper)

      expect(input).toHaveFocus()
    })

    it('applies focus-within styles', () => {
      const { container } = render(<TagsInput value={[]} onChange={() => {}} />)

      const wrapper = container.querySelector('.focus-within\\:ring-2')
      expect(wrapper).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('has base container styles', () => {
      const { container } = render(<TagsInput value={[]} onChange={() => {}} />)

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass(
        'w-full',
        'min-h-[44px]',
        'px-3',
        'py-2',
        'bg-background',
        'border',
        'border-border',
        'rounded-lg'
      )
    })

    it('has focus-within ring styles', () => {
      const { container } = render(<TagsInput value={[]} onChange={() => {}} />)

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('focus-within:ring-2', 'focus-within:ring-primary/50')
    })

    it('has cursor-text on container', () => {
      const { container } = render(<TagsInput value={[]} onChange={() => {}} />)

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('cursor-text')
    })

    it('input has transparent background', () => {
      render(<TagsInput value={[]} onChange={() => {}} />)

      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('bg-transparent')
    })

    it('input has no outline', () => {
      render(<TagsInput value={[]} onChange={() => {}} />)

      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('outline-none')
    })
  })

  describe('Badge Integration', () => {
    it('renders tags as removable badges', () => {
      render(<TagsInput value={['tag1', 'tag2']} onChange={() => {}} />)

      const removeButtons = screen.getAllByLabelText('Remove')
      expect(removeButtons).toHaveLength(2)
    })

    it('badges have small size', () => {
      const { container } = render(<TagsInput value={['tag1']} onChange={() => {}} />)

      const badge = container.querySelector('.px-2')
      expect(badge).toBeInTheDocument()
    })

    it('applies tag colors to badges', () => {
      const { container } = render(<TagsInput value={['tag1']} onChange={() => {}} />)

      // Badge should have color variant class
      const badge = container.querySelector('span')
      expect(badge).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('renders text input', () => {
      render(<TagsInput value={[]} onChange={() => {}} />)

      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'text')
    })

    it('has accessible placeholder', () => {
      render(<TagsInput value={[]} onChange={() => {}} placeholder="Add tags..." />)

      const input = screen.getByPlaceholderText('Add tags...')
      expect(input).toBeInTheDocument()
    })

    it('supports id for label association', () => {
      render(<TagsInput value={[]} onChange={() => {}} id="tags" />)

      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('id', 'tags')
    })

    it('remove buttons have accessible labels', () => {
      render(<TagsInput value={['tag1']} onChange={() => {}} />)

      const removeButton = screen.getByLabelText('Remove')
      expect(removeButton).toBeInTheDocument()
    })
  })

  describe('Combined Features', () => {
    it('combines all props correctly', () => {
      const onChange = vi.fn()
      render(
        <TagsInput
          value={['existing']}
          onChange={onChange}
          placeholder="Custom placeholder"
          className="custom-class"
          id="tags-input"
        />
      )

      expect(screen.getByText('existing')).toBeInTheDocument()
      expect(screen.getByRole('textbox')).toHaveAttribute('id', 'tags-input')

      const { container } = render(
        <TagsInput
          value={['existing']}
          onChange={onChange}
          placeholder="Custom placeholder"
          className="custom-class"
          id="tags-input"
        />
      )
      expect(container.querySelector('.custom-class')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles very long tag names', () => {
      const longTag = 'a'.repeat(100)
      render(<TagsInput value={[longTag]} onChange={() => {}} />)

      expect(screen.getByText(longTag)).toBeInTheDocument()
    })

    it('handles many tags', () => {
      const manyTags = Array.from({ length: 20 }, (_, i) => `tag${i}`)
      render(<TagsInput value={manyTags} onChange={() => {}} />)

      expect(screen.getAllByLabelText('Remove')).toHaveLength(20)
    })

    it('handles special characters in tags', () => {
      render(<TagsInput value={['tag@#$%']} onChange={() => {}} />)

      expect(screen.getByText('tag@#$%')).toBeInTheDocument()
    })

    it('handles unicode characters in tags', () => {
      render(<TagsInput value={['🚀', '你好', 'مرحبا']} onChange={() => {}} />)

      expect(screen.getByText('🚀')).toBeInTheDocument()
      expect(screen.getByText('你好')).toBeInTheDocument()
      expect(screen.getByText('مرحبا')).toBeInTheDocument()
    })
  })
})
