import React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import type { TextAs, TextProps } from './types'

const textVariants = cva('', {
  variants: {
    size: {
      xs: 'text-xs',
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
    },
    weight: {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    },
  },
  defaultVariants: {
    size: 'md',
    weight: 'normal',
  },
})

const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ as, size, weight, className, children, ...props }, ref) => {
    const Tag = (as ?? 'p') as TextAs

    return (
      <Tag
        ref={ref as React.Ref<HTMLParagraphElement>}
        className={cn(textVariants({ size, weight }), className)}
        {...props}
      >
        {children}
      </Tag>
    )
  },
)

Text.displayName = 'Text'

export { Text, textVariants }
export type { TextProps }
