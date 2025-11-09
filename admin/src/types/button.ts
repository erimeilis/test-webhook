import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

export const buttonVariants = cva(
  'btn',
  {
    variants: {
      // Color variants
      color: {
        default: 'btn-default',
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        accent: 'btn-accent',
        info: 'btn-info',
        success: 'btn-success',
        warning: 'btn-warning',
        error: 'btn-error',
      },
      // Style variants
      style: {
        solid: '',
        soft: 'btn-soft',
        outline: 'btn-outline',
        ghost: 'btn-ghost',
      },
      // Behavior variants
      behaviour: {
        default: '',
        active: 'btn-active',
        disabled: 'btn-disabled',
      },
      // Size variants
      size: {
        xs: 'btn-xs',
        sm: 'btn-sm',
        md: 'btn-md',
        lg: 'btn-lg',
        xl: 'btn-xl',
      },
      // Modifier variants
      modifier: {
        default: '',
        wide: 'btn-wide',
        square: 'btn-square',
        circle: 'btn-circle',
      },
    },
    defaultVariants: {
      color: 'primary',
      style: 'solid',
      behaviour: 'default',
      size: 'md',
      modifier: 'default',
    },
  }
)

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color' | 'style'>,
    VariantProps<typeof buttonVariants> {
  processing?: boolean
  success?: boolean
  fail?: boolean
  prefixIcon?: React.ComponentType<{ size?: number | string; className?: string }>
  postfixIcon?: React.ComponentType<{ size?: number | string; className?: string }>
}

export type ButtonVariantProps = VariantProps<typeof buttonVariants>
