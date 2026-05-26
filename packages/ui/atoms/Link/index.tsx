'use client'

import React from 'react'
import NextLink from 'next/link'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import type { LinkProps } from './types'

const linkVariants = cva(
  'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-sm',
  {
    variants: {
      variant: {
        default: 'text-blue-600 hover:text-blue-800',
        underline: 'text-blue-600 underline hover:text-blue-800',
        muted: 'text-gray-500 hover:text-gray-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ href, variant, external, className, children, ...props }, ref) => {
    const externalProps = external
      ? { target: '_blank', rel: 'noopener noreferrer' }
      : {}

    return (
      <NextLink
        ref={ref}
        href={href}
        className={cn(linkVariants({ variant }), className)}
        {...externalProps}
        {...props}
      >
        {children}
      </NextLink>
    )
  },
)

Link.displayName = 'Link'

export { Link, linkVariants }
export type { LinkProps }
