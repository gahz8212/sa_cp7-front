export type ComboboxOption<T> = {
  value: T
  label: string
  disabled?: boolean
}

export type ComboboxStatus = 'default' | 'error' | 'success'
export type ComboboxSize = 'sm' | 'md'

export type ComboboxBaseProps<T> = {
  options: ComboboxOption<T>[]
  maxCount?: number
  clearable?: boolean
  emptyText?: string
  placeholder?: string
  disabled?: boolean
  status?: ComboboxStatus
  size?: ComboboxSize
  className?: string
  popupClassName?: string
}

export type SingleComboboxProps<T> = ComboboxBaseProps<T> & {
  multiple?: false
  value?: T | null
  onChange?: (value: T | null) => void
}

export type MultipleComboboxProps<T> = ComboboxBaseProps<T> & {
  multiple: true
  value?: T[]
  onChange?: (value: T[]) => void
}

export type ComboboxProps<T> = SingleComboboxProps<T> | MultipleComboboxProps<T>
