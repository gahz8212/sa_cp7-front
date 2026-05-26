export type SelectSize = 'sm' | 'md' | 'lg'

export type SelectOption = {
  label: string
  value: string
  disabled?: boolean
}

export type SelectProps = {
  options: SelectOption[]
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  placeholder?: string
  size?: SelectSize
  disabled?: boolean
  className?: string
}
