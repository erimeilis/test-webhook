/**
 * Input Component - DaisyUI Style
 * Reusable input field with consistent styling
 */

interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'url' | 'search' | 'tel'
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  required?: boolean
  name?: string
  id?: string
  autoFocus?: boolean
  variant?: 'default' | 'primary' | 'error' | 'success'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Input({
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled = false,
  required = false,
  name,
  id,
  autoFocus = false,
  variant = 'default',
  size = 'md',
  className = '',
}: InputProps) {
  // Base styles
  const baseStyles = 'w-full rounded border bg-background transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  // Variant styles
  const variantStyles = {
    default: 'border-border focus:border-primary focus:ring-primary/50',
    primary: 'border-primary focus:ring-primary/50',
    error: 'border-destructive focus:ring-destructive/50',
    success: 'border-green-500 focus:ring-green-500/50',
  }

  // Size styles
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  const allStyles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`

  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      required={required}
      name={name}
      id={id}
      autoFocus={autoFocus}
      className={allStyles}
    />
  )
}
