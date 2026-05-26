import React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import type { LabelProps } from './types'

const labelVariants = cva('font-medium text-gray-700 leading-none', {
  variants: {
    size: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ size, required, className, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(labelVariants({ size }), className)}
        {...props}
      >
        {children}
        {required && (
          <span className="ml-0.5 text-red-500" aria-hidden="true">
            *
          </span>
        )}
      </label>
    )
  },
)

Label.displayName = 'Label'

export { Label, labelVariants }
export type { LabelProps }
