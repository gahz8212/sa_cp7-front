import type { Locale } from 'date-fns'
import type { DateFormat } from '../_internal/formats'

export type DatePickerStatus = 'default' | 'error' | 'success'

export type DatePickerCaptionLayout = 'label' | 'dropdown' | 'dropdown-months' | 'dropdown-years'

export type DatePickerProps = {
  value?: Date
  onChange?: (date: Date | undefined) => void
  format?: DateFormat
  placeholder?: string
  locale?: Locale
  editable?: boolean
  minDate?: Date
  maxDate?: Date
  clearable?: boolean
  disabled?: boolean
  status?: DatePickerStatus
  captionLayout?: DatePickerCaptionLayout
  className?: string
  calendarClassName?: string
  id?: string
  name?: string
}
