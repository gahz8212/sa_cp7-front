import type { ReactNode } from 'react'

export type AlertVariant = 'Error' | 'success' | 'successBg'

export type AlertRendererProps = {
  title?: string
  message: string
  variant?: AlertVariant
  className?: string
  actions?: ReactNode
  onDimClick?: () => void
}

export type PopupProviderProps = {
  children: ReactNode
  alertRenderer: (props: AlertRendererProps) => ReactNode
}

export type PopupStateType = {
  title?: string
  message: string
  variant?: AlertVariant
  className?: string
  actions?: ReactNode
  onDimClick?: () => void
  resolve: (value: boolean | PromiseLike<boolean>) => void
}

export type TostStateType = {
  message: string
  type: string
  resolve: (value: boolean | PromiseLike<boolean>) => void
}

export type PopupContextType = {
  showErrorOnlyText: (title: string, message: string, className?: string) => Promise<boolean>
  showErrorSingleButton: (title: string, message: string, btnPrcd: string, className?: string) => Promise<boolean>
  showErrorDoubleButton: (title: string, message: string, btnPrcd: string, btnCncl: string, className?: string) => Promise<boolean>
  showSuccessOnlyText: (title: string, message: string, className?: string) => Promise<boolean>
  showSuccessSingleButton: (title: string, message: string, btnPrcd: string, className?: string) => Promise<boolean>
  showSuccessDoubleButton: (title: string, message: string, btnPrcd: string, btnCncl: string, className?: string) => Promise<boolean>
  showSuccessBgOnlyText: (title: string, message: string, className?: string) => Promise<boolean>
  showSuccessBgSingleButton: (title: string, message: string, btnPrcd: string, className?: string) => Promise<boolean>
  showSuccessBgDoubleButton: (title: string, message: string, btnPrcd: string, btnCncl: string, className?: string) => Promise<boolean>
  showToast: (message: string, type?: string) => Promise<boolean>
}
