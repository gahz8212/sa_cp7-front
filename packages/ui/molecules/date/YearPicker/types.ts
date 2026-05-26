import type { Locale } from 'date-fns'

export type YearPickerProps = {
  value?: number
  onChange?: (year: number | undefined) => void
  locale?: Locale
  minDate?: Date
  maxDate?: Date
  disabled?: boolean
  clearable?: boolean
  placeholder?: string
  className?: string
  calendarClassName?: string
}
