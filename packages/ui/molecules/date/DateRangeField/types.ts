import type { Locale } from 'date-fns'
import type { DateFormat } from '../_internal/formats'
import type { DateRange } from '../DateRangePicker/types'
import type { DatePickerCaptionLayout } from '../DatePicker/types'

export type DateRangeFieldProps = {
  value?: DateRange
  onChange?: (range: DateRange | undefined) => void
  format?: DateFormat
  placeholder?: { from?: string; to?: string }
  locale?: Locale
  minDate?: Date
  maxDate?: Date
  disabled?: boolean
  captionLayout?: DatePickerCaptionLayout
  fromClassName?: string
  toClassName?: string
  calendarClassName?: string
}

export type { DateRange }
