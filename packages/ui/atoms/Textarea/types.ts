import type React from 'react'

export type TextareaSize = 'sm' | 'md' | 'lg'
export type TextareaStatus = 'default' | 'error' | 'success'

export type TextareaProps = React.ComponentPropsWithoutRef<'textarea'> & {
  size?: TextareaSize
  status?: TextareaStatus
}
