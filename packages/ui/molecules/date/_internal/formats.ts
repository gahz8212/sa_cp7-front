import { format as dateFnsFormat, parse, isValid } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { Locale } from 'date-fns'

export type DateFormat = 'dot' | 'dash' | 'slash'

export const FORMAT_MAP = {
  dot: 'yyyy.MM.dd',
  dash: 'yyyy-MM-dd',
  slash: 'yyyy/MM/dd',
} as const satisfies Record<DateFormat, string>

export const MASK_MAP = {
  dot: '0000.00.00',
  dash: '0000-00-00',
  slash: '0000/00/00',
} as const satisfies Record<DateFormat, string>

export const PLACEHOLDER_MAP = {
  dot: 'yyyy.mm.dd',
  dash: 'yyyy-mm-dd',
  slash: 'yyyy/mm/dd',
} as const satisfies Record<DateFormat, string>

export const DEFAULT_LOCALE: Locale = ko

export function formatDate(date: Date, fmt: DateFormat): string {
  return dateFnsFormat(date, FORMAT_MAP[fmt])
}

export function parseDate(str: string, fmt: DateFormat): Date | null {
  const parsed = parse(str, FORMAT_MAP[fmt], new Date())
  return isValid(parsed) ? parsed : null
}

export function formatYear(year: number, locale: Locale): string {
  return locale.code?.startsWith('ko') ? `${year}년` : `${year}`
}

export function getDefaultYearPlaceholder(locale: Locale): string {
  return locale.code?.startsWith('ko') ? '년도 선택' : 'Select year'
}

export const YEAR_MONTH_FORMAT_MAP = {
  dot: 'yyyy.MM',
  dash: 'yyyy-MM',
  slash: 'yyyy/MM',
} as const satisfies Record<DateFormat, string>

export const YEAR_MONTH_PLACEHOLDER_MAP = {
  dot: 'yyyy.mm',
  dash: 'yyyy-mm',
  slash: 'yyyy/mm',
} as const satisfies Record<DateFormat, string>

export function formatYearMonth(date: Date, fmt: DateFormat): string {
  return dateFnsFormat(date, YEAR_MONTH_FORMAT_MAP[fmt])
}

export function getDefaultYearMonthPlaceholder(locale: Locale): string {
  return locale.code?.startsWith('ko') ? '년월 선택' : 'Select month'
}
