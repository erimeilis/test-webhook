/**
 * Select Component - DaisyUI Style
 * Reusable select dropdown with consistent styling
 */

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  options: SelectOption[]
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
  disabled?: boolean
  required?: boolean
  name?: string
  id?: string
  placeholder?: string
  variant?: 'default' | 'primary' | 'error' | 'success'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Select({
  options,
  value,
  onChange,
  disabled = false,
  required = false,
  name,
  id,
  placeholder,
  variant = 'default',
  size = 'md',
  className = '',
}: SelectProps) {
  // Base styles
  const baseStyles = 'w-full rounded border bg-background transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3E%3C/svg%3E")] bg-[length:1.5em_1.5em] bg-[right_0.5rem_center] bg-no-repeat pr-10'

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
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      required={required}
      name={name}
      id={id}
      className={allStyles}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
