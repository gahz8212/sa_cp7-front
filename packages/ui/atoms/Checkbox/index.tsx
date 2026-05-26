'use client'

import React from 'react'
import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import type { CheckboxProps } from './types'

const checkboxVariants = cva(
  'shrink-0 rounded border border-gray-300 bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[checked]:bg-blue-600 data-[checked]:border-blue-600',
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

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ checked, defaultChecked, onCheckedChange, disabled, size, className, 'aria-label': ariaLabel }, ref) => {
    return (
      <BaseCheckbox.Root
        ref={ref}
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-label={ariaLabel}
        className={cn(checkboxVariants({ size }), className)}
      >
        <BaseCheckbox.Indicator className="flex items-center justify-center text-white">
          <svg
            className="h-3 w-3"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </BaseCheckbox.Indicator>
      </BaseCheckbox.Root>
    )
  },
)

Checkbox.displayName = 'Checkbox'

export { Checkbox }
export type { CheckboxProps }
