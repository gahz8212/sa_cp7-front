import React from 'react'
import { cn } from '../../lib/utils'
import type { DividerProps } from './types'

const Divider = React.forwardRef<HTMLHRElement, DividerProps>(
  ({ orientation = 'horizontal', className, ...props }, ref) => {
    if (orientation === 'vertical') {
      return (
        <div
          role="separator"
          aria-orientation="vertical"
          className={cn('inline-block self-stretch w-px bg-gray-200', className)}
        />
      )
    }

    return (
      <hr
        ref={ref}
        role="separator"
        aria-orientation="horizontal"
        className={cn('border-0 border-t border-gray-200 w-full', className)}
        {...props}
      />
    )
  },
)

Divider.displayName = 'Divider'

export { Divider }
export type { DividerProps }
