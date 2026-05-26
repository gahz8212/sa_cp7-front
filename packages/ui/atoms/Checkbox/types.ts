export type CheckboxSize = 'sm' | 'md' | 'lg'

export type CheckboxProps = {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  size?: CheckboxSize
  className?: string
  'aria-label'?: string
}
