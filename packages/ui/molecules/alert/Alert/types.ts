import type { ReactNode } from 'react'

export type AlertVariant = 'Error' | 'success' | 'successBg'

export type AlertProps = {
  title?: string
  message: string
  variant?: AlertVariant
  className?: string
  actions?: ReactNode
  onDimClick?: () => void
}
