/**
 * Professional Button Component
 * Using CVA for variant management with icon support
 */
import * as React from 'react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/types/button'
import type { ButtonProps } from '@/types/button'

function Button({
  className,
  color,
  style,
  behaviour,
  size,
  modifier,
  processing = false,
  success = false,
  fail = false,
  prefixIcon,
  postfixIcon,
  disabled,
  children,
  onClick,
  ...props
}: ButtonProps) {
  // Determine if the button should be disabled
  const isDisabled = disabled || processing

  // Determine the effective color and style based on success or fail state
  const effectiveColor = success ? 'success' : fail ? 'error' : color
  const effectiveStyle = success ? 'soft' : fail ? 'soft' : style
  // Automatically set behaviour to 'disabled' if button is disabled
  const effectiveBehaviour = isDisabled ? 'disabled' : behaviour

  // Determine icon size based on button size
  const getIconSize = () => {
    switch (size) {
      case 'xs':
        return 12
      case 'sm':
        return 14
      case 'md':
        return 16
      case 'lg':
        return 18
      case 'xl':
        return 20
      default:
        return 16
    }
  }

  const iconSize = getIconSize()

  // Loading spinner component with CSS animation
  const LoadingSpinner = () => (
    <svg
      className="animate-spin"
      width={iconSize}
      height={iconSize}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )

  // Success check icon
  const SuccessIcon = () => (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="transition-all duration-300"
    >
      <path
        d="M20 6L9 17L4 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )

  // Fail X icon
  const FailIcon = () => (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="transition-all duration-300"
    >
      <path
        d="M18 6L6 18M6 6L18 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )

  // Render content with state-based icons and prefix/postfix icons
  const renderContent = () => (
    <>
      {/* Success icon with animation */}
      {success && (
        <span className="animate-in fade-in zoom-in duration-300">
          <SuccessIcon />
        </span>
      )}

      {/* Fail icon with animation */}
      {fail && (
        <span className="animate-in fade-in zoom-in duration-300">
          <FailIcon />
        </span>
      )}

      {/* Processing state (only show when not in a success or fail state) */}
      {!success && !fail && processing && <LoadingSpinner />}

      {/* Prefix icon (only show when not in processing, success, or fail state) */}
      {!processing && !success && !fail && prefixIcon && React.createElement(prefixIcon, { size: iconSize })}

      {/* Button text/children */}
      {children && <span>{children}</span>}

      {/* Postfix icon (only show when not in processing, success, or fail state) */}
      {!processing && !success && !fail && postfixIcon && React.createElement(postfixIcon, { size: iconSize })}
    </>
  )

  return (
    <button
      className={cn(
        buttonVariants({ color: effectiveColor, style: effectiveStyle, behaviour: effectiveBehaviour, size, modifier }),
        className
      )}
      disabled={isDisabled}
      {...(onClick ? { onClick } : {})}
      {...props}
    >
      {renderContent()}
    </button>
  )
}

export { Button }
