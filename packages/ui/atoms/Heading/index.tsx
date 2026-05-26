import React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import type { HeadingLevel, HeadingProps } from './types'

const headingVariants = cva('font-bold leading-tight tracking-tight', {
  variants: {
    size: {
      sm: 'text-lg',
      md: 'text-xl',
      lg: 'text-2xl',
      xl: 'text-3xl',
      '2xl': 'text-4xl',
      '3xl': 'text-5xl',
    },
  },
  defaultVariants: {
    size: 'lg',
  },
})

const defaultSizeMap: Record<HeadingLevel, NonNullable<HeadingProps['size']>> = {
  1: '3xl',
  2: '2xl',
  3: 'xl',
  4: 'lg',
  5: 'md',
  6: 'sm',
}

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ level = 2, size, className, children, ...props }, ref) => {
    const Tag = `h${level}` as `h${HeadingLevel}`
    const resolvedSize = size ?? defaultSizeMap[level]

    return (
      <Tag
        ref={ref}
        className={cn(headingVariants({ size: resolvedSize }), className)}
        {...props}
      >
        {children}
      </Tag>
    )
  },
)

Heading.displayName = 'Heading'

export { Heading, headingVariants }
export type { HeadingProps }
