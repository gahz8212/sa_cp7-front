import type React from 'react'

export type ChipVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'
export type ChipSize = 'sm' | 'md'

export type ChipProps = React.ComponentPropsWithoutRef<'div'> & {
  variant?: ChipVariant
  size?: ChipSize
  disabled?: boolean
  onRemove?: (e: React.MouseEvent<HTMLButtonElement>) => void
}
