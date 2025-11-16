/**
 * Triple Toggle Switch Component
 * Professional toggle switch with smooth animations and variant support
 */
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const toggleSwitchVariants = cva(
  'relative inline-grid gap-1 rounded-lg p-1 h-9 transition-colors',
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
  'rounded-md transition-all duration-300 ease-out pointer-events-none h-full border',
  {
    variants: {
      color: {
        default: 'toggle-default',
        primary: 'toggle-primary',
        secondary: 'toggle-secondary',
        accent: 'toggle-primary',
        info: 'toggle-primary',
        success: 'toggle-success',
        warning: 'toggle-warning',
        error: 'toggle-error',
      },
      style: {
        solid: 'toggle-solid',
        soft: 'toggle-soft',
        outline: 'toggle-outline',
      },
    },
    defaultVariants: {
      color: 'primary',
      style: 'solid',
    },
  }
)

const buttonTextVariants = cva(
  'relative z-10 px-4 text-sm font-medium rounded-md transition-colors duration-200 cursor-pointer border border-transparent h-full flex items-center justify-center',
  {
    variants: {
      isActive: {
        true: '',
        false: 'text-muted-foreground hover:text-foreground',
      },
      color: {
        default: 'toggle-default',
        primary: 'toggle-primary',
        secondary: 'toggle-secondary',
        accent: 'toggle-primary',
        info: 'toggle-primary',
        success: 'toggle-success',
        warning: 'toggle-warning',
        error: 'toggle-error',
      },
      style: {
        solid: '',
        soft: '',
        outline: '',
      },
    },
    compoundVariants: [
      // Active text colors for solid style
      {
        isActive: true,
        style: 'solid',
        className: 'text-primary-foreground',
      },
      // Active text colors for soft style
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
      // Active text colors for outline style
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
      style={{
        gridTemplateColumns: `repeat(${options.length}, 1fr)`,
      }}
    >
      {/* Sliding background indicator */}
      <div
        className={cn(indicatorVariants({ color, style }))}
        data-toggle-indicator
        style={{
          gridColumn: '1 / 2',
          gridRow: '1',
          transform: `translateX(calc(${validActiveIndex * 100}% + ${validActiveIndex} * 0.25rem))`,
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
          style={{
            gridColumn: `${index + 1} / ${index + 2}`,
            gridRow: '1',
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
