"use client"

import React, { useState, useCallback, useMemo } from "react"
import { Popover } from "@base-ui/react/popover"
import { DayPicker } from "react-day-picker"
import type { DateRange as DayPickerDateRange } from "react-day-picker"
import { cn } from "../../../lib/utils"
import { inputVariants } from "../../../atoms/Input"
import { PLACEHOLDER_MAP, DEFAULT_LOCALE, formatDate } from "../_internal/formats"
import { calendarClassNames } from "../_internal/styles"
import type { DateRangePickerProps, DateRange } from "./types"

const CalendarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

const SEPARATOR = " ~ "

const DateRangePicker = React.forwardRef<HTMLDivElement, DateRangePickerProps>(
  (
    {
      value,
      onChange,
      format = "dot",
      placeholder,
      locale = DEFAULT_LOCALE,
      minDate,
      maxDate,
      disabled = false,
      numberOfMonths = 2,
      captionLayout = "label",
      className,
      calendarClassName,
    },
    ref,
  ) => {
    const [open, setOpen] = useState(false)
    // picker 내부에서 진행 중인 선택 상태 (외부 value와 분리)
    const [draftRange, setDraftRange] = useState<DayPickerDateRange | undefined>(undefined)

    const isDropdownMode = captionLayout !== "label"
    const hasYearDropdown = captionLayout === "dropdown" || captionLayout === "dropdown-years"
    const effectiveNumberOfMonths = isDropdownMode ? 1 : numberOfMonths

    const endMonth = useMemo(() => {
      if (maxDate) return maxDate
      if (hasYearDropdown) {
        const d = new Date()
        d.setFullYear(d.getFullYear() + 10)
        return d
      }
      return undefined
    }, [maxDate, hasYearDropdown])

    const displayValue = useMemo(() => {
      if (!value?.from && !value?.to) return ""
      const fmt = PLACEHOLDER_MAP[format]
      const from = value?.from ? formatDate(value.from, format) : fmt
      const to = value?.to ? formatDate(value.to, format) : fmt
      return `${from}${SEPARATOR}${to}`
    }, [value, format])

    const resolvedPlaceholder =
      placeholder ?? `${PLACEHOLDER_MAP[format]}${SEPARATOR}${PLACEHOLDER_MAP[format]}`

    const handleOpenChange = useCallback(
      (o: boolean) => {
        setOpen(o)
        // 열릴 때 기존 선택값으로 초기화 → 달력에 기존 선택 표시 (label/dropdown 모드 동일)
        if (o) setDraftRange(value ? { from: value.from, to: value.to } : undefined)
      },
      [value],
    )

    const handleSelect = useCallback(
      (_range: DayPickerDateRange | undefined, selectedDay: Date) => {
        if (!draftRange?.from || draftRange?.to) {
          // 1번째 클릭: from 없거나 완성된 범위 표시 중 → 초기화 후 새 from 저장
          setDraftRange({ from: selectedDay, to: undefined })
          onChange?.({ from: selectedDay, to: undefined })
        } else {
          // 2번째 클릭: from만 있는 상태 → 역순 포함하여 from/to 확정 후 닫힘
          const from = selectedDay < draftRange.from ? selectedDay : draftRange.from
          const to = selectedDay < draftRange.from ? draftRange.from : selectedDay
          onChange?.({ from, to })
          setOpen(false)
        }
      },
      [draftRange, onChange],
    )

    const disabledMatcher = [
      ...(minDate ? [{ before: minDate }] : []),
      ...(maxDate ? [{ after: maxDate }] : []),
    ]

    return (
      <div ref={ref} className="w-full">
        <Popover.Root open={open} onOpenChange={handleOpenChange}>
          <Popover.Trigger
            render={<button type="button" disabled={disabled} aria-label={resolvedPlaceholder} />}
            className={cn(
              inputVariants({}),
              "relative w-full text-left pr-10 cursor-pointer select-none focus:outline-none focus:ring-0 focus:border-gray-300",
              !displayValue && "text-gray-400",
              disabled && "opacity-50",
              className,
            )}
          >
            <span>{displayValue || resolvedPlaceholder}</span>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <CalendarIcon />
            </span>
          </Popover.Trigger>

          <Popover.Portal>
            <Popover.Positioner side="bottom" align="start" sideOffset={4}>
              <Popover.Popup
                className={cn(
                  "z-50 rounded-lg border border-gray-200 bg-white shadow-md outline-none",
                  "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 transition-opacity duration-150",
                  calendarClassName,
                )}
              >
                <DayPicker
                  mode="range"
                  selected={draftRange}
                  onSelect={handleSelect}
                  locale={locale}
                  disabled={disabledMatcher.length > 0 ? disabledMatcher : undefined}
                  numberOfMonths={effectiveNumberOfMonths}
                  classNames={calendarClassNames}
                  defaultMonth={draftRange?.from ?? value?.from}
                  fixedWeeks
                  captionLayout={captionLayout}
                  startMonth={isDropdownMode ? minDate : undefined}
                  endMonth={isDropdownMode ? endMonth : undefined}
                  formatters={{
                    formatYearDropdown: (year, dateLib) =>
                      `${dateLib?.format(year, "yyyy") ?? year.getFullYear()}년`,
                  }}
                />
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </div>
    )
  },
)

DateRangePicker.displayName = "DateRangePicker"

export { DateRangePicker }
export type { DateRangePickerProps, DateRange }
