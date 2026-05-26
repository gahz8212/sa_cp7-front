import React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import type { ChipProps } from './types'

const chipVariants = cva(
  'inline-flex items-center gap-1 rounded-full font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-gray-100 text-gray-700',
        primary: 'bg-blue-100 text-blue-700',
        success: 'bg-green-100 text-green-700',
        warning: 'bg-yellow-100 text-yellow-700',
        error: 'bg-red-100 text-red-700',
        info: 'bg-sky-100 text-sky-700',
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

const Chip = React.forwardRef<HTMLDivElement, ChipProps>(
  ({ variant, size, disabled = false, onRemove, onClick, className, children, ...props }, ref) => {
    const isClickable = !!onClick

    const handleRemove = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      onRemove?.(e)
    }

    return (
      <div
        ref={ref}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable && !disabled ? 0 : undefined}
        aria-disabled={disabled || undefined}
        onClick={!disabled && isClickable ? onClick : undefined}
        className={cn(
          chipVariants({ variant, size }),
          isClickable && !disabled && 'cursor-pointer hover:brightness-95',
          disabled && 'opacity-50 cursor-not-allowed',
          className,
        )}
        {...props}
      >
        {children}
        {onRemove && (
          <button
            type="button"
            aria-label="삭제"
            disabled={disabled}
            onClick={handleRemove}
            className="ml-0.5 rounded-full p-0.5 hover:bg-black/10 disabled:pointer-events-none"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <line x1="2" y1="2" x2="10" y2="10" />
              <line x1="10" y1="2" x2="2" y2="10" />
            </svg>
          </button>
        )}
      </div>
    )
  },
)

Chip.displayName = 'Chip'

export { Chip, chipVariants }
export type { ChipProps }
