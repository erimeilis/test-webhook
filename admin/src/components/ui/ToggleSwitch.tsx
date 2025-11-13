/**
 * Triple Toggle Switch Component
 * Professional toggle switch with smooth animations and variant support
 */
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const toggleSwitchVariants = cva(
  'relative inline-flex rounded-lg p-1 transition-colors',
  {
    variants: {
      color: {
        default: '',
        primary: '',
        secondary: '',
        accent: '',
        info: '',
        success: '',
        warning: '',
        error: '',
      },
      style: {
        solid: 'bg-background border border-border',
        soft: 'bg-muted/50 border border-border/50',
        outline: 'bg-transparent border-2 border-border',
      },
    },
    defaultVariants: {
      color: 'primary',
      style: 'solid',
    },
  }
)

const indicatorVariants = cva(
  'absolute inset-y-1 rounded-md transition-all duration-200 ease-out pointer-events-none',
  {
    variants: {
      color: {
        default: 'bg-muted',
        primary: 'bg-primary',
        secondary: 'bg-secondary',
        accent: 'bg-accent',
        info: 'bg-info',
        success: 'bg-success',
        warning: 'bg-warning',
        error: 'bg-destructive',
      },
      style: {
        solid: '',
        soft: 'opacity-60',
        outline: 'border-2',
      },
    },
    compoundVariants: [
      // Outline style uses border color instead of background
      {
        style: 'outline',
        color: 'primary',
        className: 'bg-transparent border-primary',
      },
      {
        style: 'outline',
        color: 'secondary',
        className: 'bg-transparent border-secondary',
      },
      {
        style: 'outline',
        color: 'success',
        className: 'bg-transparent border-success',
      },
      {
        style: 'outline',
        color: 'warning',
        className: 'bg-transparent border-warning',
      },
      {
        style: 'outline',
        color: 'error',
        className: 'bg-transparent border-destructive',
      },
    ],
    defaultVariants: {
      color: 'primary',
      style: 'solid',
    },
  }
)

const buttonTextVariants = cva(
  'relative z-10 px-4 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 cursor-pointer',
  {
    variants: {
      isActive: {
        true: '',
        false: 'text-muted-foreground hover:text-foreground',
      },
      color: {
        default: '',
        primary: '',
        secondary: '',
        accent: '',
        info: '',
        success: '',
        warning: '',
        error: '',
      },
      style: {
        solid: '',
        soft: '',
        outline: '',
      },
    },
    compoundVariants: [
      // Active state text colors for solid style
      {
        isActive: true,
        style: 'solid',
        className: 'text-primary-foreground',
      },
      // Active state text colors for soft style
      {
        isActive: true,
        style: 'soft',
        color: 'primary',
        className: 'text-primary',
      },
      {
        isActive: true,
        style: 'soft',
        color: 'secondary',
        className: 'text-secondary',
      },
      {
        isActive: true,
        style: 'soft',
        color: 'success',
        className: 'text-success',
      },
      {
        isActive: true,
        style: 'soft',
        color: 'warning',
        className: 'text-warning',
      },
      {
        isActive: true,
        style: 'soft',
        color: 'error',
        className: 'text-destructive',
      },
      // Active state text colors for outline style
      {
        isActive: true,
        style: 'outline',
        color: 'primary',
        className: 'text-primary',
      },
      {
        isActive: true,
        style: 'outline',
        color: 'secondary',
        className: 'text-secondary',
      },
      {
        isActive: true,
        style: 'outline',
        color: 'success',
        className: 'text-success',
      },
      {
        isActive: true,
        style: 'outline',
        color: 'warning',
        className: 'text-warning',
      },
      {
        isActive: true,
        style: 'outline',
        color: 'error',
        className: 'text-destructive',
      },
    ],
    defaultVariants: {
      isActive: false,
      color: 'primary',
      style: 'solid',
    },
  }
)

interface ToggleSwitchOption {
  value: string
  label: string
}

interface ToggleSwitchProps extends VariantProps<typeof toggleSwitchVariants> {
  options: ToggleSwitchOption[]
  defaultValue?: string
  dataAttribute?: string
  className?: string
}

export function ToggleSwitch({
  options,
  defaultValue,
  dataAttribute = 'toggle-switch',
  color = 'primary',
  style = 'solid',
  className,
}: ToggleSwitchProps) {
  if (options.length < 2 || options.length > 3) {
    console.warn('ToggleSwitch: options should contain 2-3 items')
  }

  const activeIndex = defaultValue
    ? options.findIndex(opt => opt.value === defaultValue)
    : 0

  const validActiveIndex = activeIndex >= 0 ? activeIndex : 0

  return (
    <div
      className={cn(toggleSwitchVariants({ color, style }), className)}
      data-toggle-switch={dataAttribute}
    >
      {/* Sliding background indicator */}
      <div
        className={cn(indicatorVariants({ color, style }))}
        data-toggle-indicator
        style={{
          width: `calc(${100 / options.length}% - 0.5rem)`,
          transform: `translateX(calc(${validActiveIndex * 100}% + 0.25rem))`,
        }}
      />

      {/* Toggle buttons */}
      {options.map((option, index) => (
        <button
          key={option.value}
          type="button"
          data-toggle-value={option.value}
          className={cn(
            buttonTextVariants({
              isActive: validActiveIndex === index,
              color,
              style,
            })
          )}
          style={{ minWidth: '3.5rem' }}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
