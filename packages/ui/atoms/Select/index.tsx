'use client'

import React from 'react'
import { Select as BaseSelect } from '@base-ui/react/select'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import type { SelectProps } from './types'

const triggerVariants = cva(
  'flex w-full items-center justify-between rounded-md border border-gray-300 bg-white font-normal text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-3 text-sm',
        lg: 'h-11 px-4 text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
)

const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  ({ options, value, defaultValue, onChange, placeholder, size, disabled, className }, ref) => {
    return (
      <BaseSelect.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={(val) => onChange?.(val ?? '')}
        disabled={disabled}
      >
        <BaseSelect.Trigger ref={ref} className={cn(triggerVariants({ size }), className)}>
          <BaseSelect.Value placeholder={placeholder ?? '선택하세요'} />
          <BaseSelect.Icon className="ml-auto">
            <svg
              className="h-4 w-4 opacity-50"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </BaseSelect.Icon>
        </BaseSelect.Trigger>
        <BaseSelect.Portal>
          <BaseSelect.Positioner sideOffset={4}>
            <BaseSelect.Popup className="z-50 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white shadow-md">
              <BaseSelect.List className="p-1">
                {options.map((option) => (
                  <BaseSelect.Item
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm text-gray-900 outline-none hover:bg-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-gray-100"
                  >
                    <BaseSelect.ItemText>{option.label}</BaseSelect.ItemText>
                  </BaseSelect.Item>
                ))}
              </BaseSelect.List>
            </BaseSelect.Popup>
          </BaseSelect.Positioner>
        </BaseSelect.Portal>
      </BaseSelect.Root>
    )
  },
)

Select.displayName = 'Select'

export { Select }
export type { SelectProps }
