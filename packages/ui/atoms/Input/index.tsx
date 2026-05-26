'use client'

import React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import type { InputProps } from './types'

const inputVariants = cva(
  'w-full rounded-md border bg-white font-normal text-gray-900 placeholder:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-3 text-sm',
        lg: 'h-11 px-4 text-base',
      },
      status: {
        default: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
        error: 'border-red-500 focus:border-red-500 focus:ring-red-500',
        success: 'border-green-500 focus:border-green-500 focus:ring-green-500',
      },
    },
    defaultVariants: {
      size: 'md',
      status: 'default',
    },
  },
)

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ size, status, className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(inputVariants({ size, status }), className)}
        {...props}
      />
    )
  },
)

Input.displayName = 'Input'

export { Input, inputVariants }
export type { InputProps }
