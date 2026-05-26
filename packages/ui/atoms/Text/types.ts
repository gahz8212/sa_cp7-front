import type React from 'react'

export type TextAs = 'p' | 'span' | 'div' | 'strong' | 'em' | 'small'
export type TextSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold'

export type TextProps = React.ComponentPropsWithoutRef<'p'> & {
  as?: TextAs
  size?: TextSize
  weight?: TextWeight
}
