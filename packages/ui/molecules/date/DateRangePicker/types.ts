import type { Locale } from 'date-fns'
import type { DateFormat } from '../_internal/formats'
import type { DatePickerCaptionLayout } from '../DatePicker/types'

export type { DatePickerCaptionLayout }

export type DateRange = {
  from: Date | undefined
  to?: Date | undefined
}

export type DateRangePickerProps = {
  value?: DateRange
  onChange?: (range: DateRange | undefined) => void
  format?: DateFormat
  placeholder?: string
  locale?: Locale
  minDate?: Date
  maxDate?: Date
  disabled?: boolean
  numberOfMonths?: number
  captionLayout?: DatePickerCaptionLayout
  className?: string
  calendarClassName?: string
}
