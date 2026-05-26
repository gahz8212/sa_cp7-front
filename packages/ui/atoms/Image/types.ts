import type NextImage from 'next/image'
import type React from 'react'

export type ImageRounded = 'none' | 'sm' | 'md' | 'lg' | 'full'

export type ImageProps = React.ComponentPropsWithoutRef<typeof NextImage> & {
  rounded?: ImageRounded
}
