import React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import type { IconProps } from './types'

const iconVariants = cva('inline-block shrink-0', {
  variants: {
    size: {
      xs: 'h-3 w-3',
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
      xl: 'h-8 w-8',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size, className, children, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
        className={cn(iconVariants({ size }), className)}
        {...props}
      >
        {children}
      </svg>
    )
  },
)

Icon.displayName = 'Icon'

export { Icon, iconVariants }
export type { IconProps }
