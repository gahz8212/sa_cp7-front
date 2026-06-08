'use client'

import React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import type { InputProps } from './types'

const inputVariants = cva(
  'w-full rounded-md  bg-white font-normal text-gray-900 placeholder:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50',
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
  ({ size, status, autoWidth, className, value, defaultValue, onChange, placeholder, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue ?? '')
    const currentDisplayValue = value ?? internalValue
    const displayValue = currentDisplayValue?.toString() ?? ''

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInternalValue(e.target.value)
      onChange?.(e)
    }

    const inputElement = (
      <input
        ref={ref}
        value={value}
        defaultValue={defaultValue}
        onChange={autoWidth ? handleChange : onChange}
        placeholder={placeholder}
        className={cn(
          inputVariants({ size, status }),
          className,
        )}
        {...props}
      />
    )

    if (autoWidth) {
      return (
        <div className="inline-grid items-center">
          <span
            className={cn(
              'invisible col-start-1 row-start-1 whitespace-pre font-sans pr-4',
              size === 'sm' && 'px-3 text-sm',
              size === 'md' && 'px-3 text-sm',
              size === 'lg' && 'px-4 text-base',
            )}
          >
            {(displayValue || placeholder || '') + '\u00A0\u00A0\u00A0'}
          </span>
          <div className="col-start-1 row-start-1 flex">{inputElement}</div>
        </div>
      )
    }

    return inputElement
  },
)

Input.displayName = 'Input'

export { Input, inputVariants }
export type { InputProps }
