export type RadioSize = 'sm' | 'md' | 'lg'

export type RadioProps = {
  value: string
  disabled?: boolean
  size?: RadioSize
  className?: string
  'aria-label'?: string
}
