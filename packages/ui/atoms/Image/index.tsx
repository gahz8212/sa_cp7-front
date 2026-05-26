import React from 'react'
import NextImage from 'next/image'
import { cn } from '../../lib/utils'
import type { ImageProps } from './types'

const roundedMap: Record<NonNullable<ImageProps['rounded']>, string> = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
}

const Image = React.forwardRef<HTMLImageElement, ImageProps>(
  ({ rounded = 'none', className, ...props }, ref) => {
    return (
      <NextImage
        ref={ref}
        className={cn(roundedMap[rounded], className)}
        {...props}
      />
    )
  },
)

Image.displayName = 'Image'

export { Image }
export type { ImageProps }
