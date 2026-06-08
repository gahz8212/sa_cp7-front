import type React from 'react'

export type InputSize = 'sm' | 'md' | 'lg'
export type InputStatus = 'default' | 'error' | 'success'

export type InputProps = Omit<React.ComponentPropsWithoutRef<'input'>, 'size'> & {
  size?: InputSize
  status?: InputStatus
  autoWidth?: boolean
}
