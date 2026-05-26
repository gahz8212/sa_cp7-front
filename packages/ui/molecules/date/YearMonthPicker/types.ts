import type { Locale } from 'date-fns'
import type { DateFormat } from '../_internal/formats'

export type YearMonthPickerProps = {
  value?: Date
  onChange?: (date: Date | undefined) => void
  format?: DateFormat
  locale?: Locale
  minDate?: Date
  maxDate?: Date
  disabled?: boolean
  clearable?: boolean
  placeholder?: string
  className?: string
  calendarClassName?: string
}
