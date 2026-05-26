import type React from 'react'

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6
export type HeadingSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'

export type HeadingProps = React.ComponentPropsWithoutRef<'h1'> & {
  level?: HeadingLevel
  size?: HeadingSize
}
