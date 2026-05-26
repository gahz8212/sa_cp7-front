import type React from 'react'

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info'
export type BadgeSize = 'sm' | 'md'

export type BadgeProps = React.ComponentPropsWithoutRef<'span'> & {
  variant?: BadgeVariant
  size?: BadgeSize
}
