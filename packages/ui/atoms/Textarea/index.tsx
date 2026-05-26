'use client'

import React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import type { TextareaProps } from './types'

const textareaVariants = cva(
  'w-full rounded-md border bg-white font-normal text-gray-900 placeholder:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 resize-y',
  {
    variants: {
      size: {
        sm: 'min-h-[80px] px-3 py-2 text-sm',
        md: 'min-h-[100px] px-3 py-2 text-sm',
        lg: 'min-h-[120px] px-4 py-3 text-base',
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

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ size, status, className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(textareaVariants({ size, status }), className)}
        {...props}
      />
    )
  },
)

Textarea.displayName = 'Textarea'

export { Textarea, textareaVariants }
export type { TextareaProps }
