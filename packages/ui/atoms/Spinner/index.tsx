import React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import type { SpinnerProps } from './types'

const spinnerVariants = cva('animate-spin text-gray-400', {
  variants: {
    size: {
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

const Spinner = ({ size, className }: SpinnerProps) => {
  return (
    <svg
      className={cn(spinnerVariants({ size }), className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-label="로딩 중"
      role="status"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

Spinner.displayName = 'Spinner'

export { Spinner }
export type { SpinnerProps }
