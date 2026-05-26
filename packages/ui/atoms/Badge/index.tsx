import React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import type { BadgeProps } from './types'

const badgeVariants = cva(
  'inline-flex items-center rounded-full font-medium',
  {
    variants: {
      variant: {
        default: 'bg-gray-100 text-gray-700',
        success: 'bg-green-100 text-green-700',
        warning: 'bg-yellow-100 text-yellow-700',
        error: 'bg-red-100 text-red-700',
        info: 'bg-blue-100 text-blue-700',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
)

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant, size, className, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </span>
    )
  },
)

Badge.displayName = 'Badge'

export { Badge, badgeVariants }
export type { BadgeProps }
