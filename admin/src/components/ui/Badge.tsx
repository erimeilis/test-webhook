/**
 * Badge Component
 * Modern chip/tag design following shadcn/ui patterns
 */

import * as React from 'react'

// eslint-disable-next-line no-undef
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
  clickable?: boolean
  removable?: boolean
  onClick?: () => void
  onRemove?: () => void
  className?: string
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  clickable = false,
  removable = false,
  onClick,
  onRemove,
  className = '',
  ...props
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center gap-1 rounded-full font-medium transition-colors'

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-sm'
  }

  const variantStyles = {
    default: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 hover:bg-blue-500/25',
    secondary: 'bg-gray-500/15 text-gray-700 dark:text-gray-300 border border-gray-500/30 hover:bg-gray-500/25',
    outline: 'bg-transparent text-foreground border border-border hover:bg-muted/50',
    success: 'bg-green-500/15 text-green-700 dark:text-green-300 border border-green-500/30 hover:bg-green-500/25',
    warning: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border border-yellow-500/30 hover:bg-yellow-500/25',
    error: 'bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30 hover:bg-red-500/25'
  }

  const clickableStyles = clickable || onClick ? 'cursor-pointer' : ''

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.stopPropagation()
      onClick()
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onRemove) {
      onRemove()
    }
  }

  return (
    <span
      {...props}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${clickableStyles} ${className}`}
      onClick={handleClick}
      role={clickable || onClick ? 'button' : undefined}
      tabIndex={clickable || onClick ? 0 : undefined}
    >
      {children}
      {removable && (
        <button
          type="button"
          onClick={handleRemove}
          className="ml-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 p-0.5 transition-colors"
          aria-label="Remove"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      )}
    </span>
  )
}
