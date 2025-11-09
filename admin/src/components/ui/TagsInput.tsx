/**
 * TagsInput Component
 * Modern tags input with chip-style visualization
 * Allows adding/removing tags with visual feedback
 */

import * as React from 'react'
import { Badge } from './Badge'
import { getTagColor } from '@/lib/tag-colors'

export interface TagsInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  className?: string
  id?: string
}

export function TagsInput({
  value,
  onChange,
  placeholder = 'Add tags...',
  className = '',
  id
}: TagsInputProps) {
  const [inputValue, setInputValue] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      // Remove last tag on backspace if input is empty
      removeTag(value.length - 1)
    }
  }

  const addTag = () => {
    const trimmed = inputValue.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
      setInputValue('')
    }
  }

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text')
    const tags = pastedText
      .split(/[,;\n]/)
      .map(t => t.trim())
      .filter(t => t && !value.includes(t))

    if (tags.length > 0) {
      onChange([...value, ...tags])
    }
  }

  return (
    <div
      className={`w-full min-h-[44px] px-3 py-2 bg-background border border-border rounded-lg focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary cursor-text transition-all ${className}`}
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex flex-wrap gap-1.5 items-center">
        {value.map((tag, index) => (
          <Badge
            key={index}
            variant={getTagColor(tag)}
            size="sm"
            removable
            onRemove={() => removeTag(index)}
          >
            {tag}
          </Badge>
        ))}
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={addTag}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm placeholder:text-muted-foreground py-0.5"
        />
      </div>
    </div>
  )
}
