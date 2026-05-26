'use client'

import React from 'react'
import { Radio as BaseRadio } from '@base-ui/react/radio'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import type { RadioProps } from './types'

const radioVariants = cva(
  'shrink-0 rounded-full border border-gray-300 bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[checked]:border-blue-600',
  {
    variants: {
      size: {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
)

const indicatorVariants = cva('rounded-full bg-blue-600', {
  variants: {
    size: {
      sm: 'h-2 w-2',
      md: 'h-2.5 w-2.5',
      lg: 'h-3 w-3',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

const Radio = React.forwardRef<HTMLButtonElement, RadioProps>(
  ({ value, disabled, size, className, 'aria-label': ariaLabel }, ref) => {
    return (
      <BaseRadio.Root
        ref={ref}
        value={value}
        disabled={disabled}
        aria-label={ariaLabel}
        className={cn(radioVariants({ size }), 'flex items-center justify-center', className)}
      >
        <BaseRadio.Indicator className={cn(indicatorVariants({ size }))} />
      </BaseRadio.Root>
    )
  },
)

Radio.displayName = 'Radio'

export { Radio }
export type { RadioProps }
