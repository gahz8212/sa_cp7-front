"use client"

import React, { useRef, useState, useCallback, useMemo } from "react"
import { Popover } from "@base-ui/react/popover"
import { DayPicker } from "react-day-picker"
import type { DateRange as DayPickerDateRange } from "react-day-picker"
import { cn } from "../../../lib/utils"
import { inputVariants } from "../../../atoms/Input"
import { PLACEHOLDER_MAP, DEFAULT_LOCALE, formatDate } from "../_internal/formats"
import { calendarClassNames } from "../_internal/styles"
import type { DateRangeFieldProps } from "./types"

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

type ActiveInput = "from" | "to"

const DateRangeField = React.forwardRef<HTMLDivElement, DateRangeFieldProps>(
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
      captionLayout = "label",
      fromClassName,
      toClassName,
      calendarClassName,
    },
    ref,
  ) => {
    const [open, setOpen] = useState(false)
    const [activeInput, setActiveInput] = useState<ActiveInput>("from")
    const [draftRange, setDraftRange] = useState<DayPickerDateRange | undefined>(undefined)
    const [calendarMonth, setCalendarMonth] = useState<Date | undefined>(undefined)

    const isDropdownMode = captionLayout !== "label"
    const hasYearDropdown = captionLayout === "dropdown" || captionLayout === "dropdown-years"

    const endMonth = useMemo(() => {
      if (maxDate) return maxDate
      if (hasYearDropdown) {
        const d = new Date()
        d.setFullYear(d.getFullYear() + 10)
        return d
      }
      return undefined
    }, [maxDate, hasYearDropdown])

    const fromRef = useRef<HTMLButtonElement>(null)
    const toRef = useRef<HTMLButtonElement>(null)

    const fromDisplay = useMemo(
      () => (value?.from ? formatDate(value.from, format) : ""),
      [value, format],
    )

    const toDisplay = useMemo(
      () => (value?.to ? formatDate(value.to, format) : ""),
      [value, format],
    )

    const fromPlaceholder = placeholder?.from ?? PLACEHOLDER_MAP[format]
    const toPlaceholder = placeholder?.to ?? PLACEHOLDER_MAP[format]

    // 활성 인풋에 따른 동적 min/max (외부 props와 합산)
    const dynamicMinDate = useMemo(() => {
      if (activeInput === "to" && value?.from) {
        return minDate && minDate > value.from ? minDate : value.from
      }
      return minDate
    }, [activeInput, value, minDate])

    const dynamicMaxDate = useMemo(() => {
      if (activeInput === "from" && value?.to) {
        return maxDate && maxDate < value.to ? maxDate : value.to
      }
      return maxDate
    }, [activeInput, value, maxDate])

    const disabledMatcher = useMemo(
      () => [
        ...(dynamicMinDate ? [{ before: dynamicMinDate }] : []),
        ...(dynamicMaxDate ? [{ after: dynamicMaxDate }] : []),
      ],
      [dynamicMinDate, dynamicMaxDate],
    )

    const handleOpenFrom = useCallback(() => {
      if (disabled) return
      setActiveInput("from")
      setDraftRange(value ? { from: value.from, to: value.to } : undefined)
      setCalendarMonth(value?.from)
      setOpen(true)
    }, [disabled, value])

    const handleOpenTo = useCallback(() => {
      if (disabled) return
      setActiveInput("to")
      setDraftRange(value ? { from: value.from, to: value.to } : undefined)
      setCalendarMonth(value?.to ?? value?.from)
      setOpen(true)
    }, [disabled, value])

    const handleOpenChange = useCallback((o: boolean) => {
      if (!o) setOpen(false)
    }, [])

    const handleSelect = useCallback(
      (_range: DayPickerDateRange | undefined, selectedDay: Date) => {
        if (activeInput === "to" && value?.from) {
          // 케이스 6: to 활성 + from 있음 → to 확정, 닫힘
          onChange?.({ from: value.from, to: selectedDay })
          setOpen(false)
        } else if (activeInput === "to" && !value?.from) {
          // 케이스 7: to 활성 + from 없음 → to 저장, from 대기
          setDraftRange({ from: undefined, to: selectedDay })
          onChange?.({ from: undefined, to: selectedDay })
          setActiveInput("from")
        } else {
          // 케이스 3/4/5: from 활성 → from 저장, to 보존 또는 초기화
          const newTo = value?.to && selectedDay <= value.to ? value.to : undefined
          setDraftRange({ from: selectedDay, to: newTo })
          onChange?.({ from: selectedDay, to: newTo })
          if (newTo) {
            setOpen(false)
          } else {
            setActiveInput("to")
          }
        }
      },
      [activeInput, value, onChange],
    )

    return (
      <div ref={ref} className="w-full">
        <Popover.Root open={open} onOpenChange={handleOpenChange}>
          <div className={cn("flex items-center gap-2", disabled && "opacity-50")}>
            {/* from input */}
            <button
              ref={fromRef}
              type="button"
              disabled={disabled}
              aria-label={fromPlaceholder}
              onClick={handleOpenFrom}
              className={cn(
                inputVariants({}),
                "flex-1 relative text-left pr-9 cursor-pointer select-none focus:outline-none focus:ring-0 focus:border-gray-300",
                !fromDisplay && "text-gray-400",
                fromClassName,
              )}
            >
              <span>{fromDisplay || fromPlaceholder}</span>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <CalendarIcon />
              </span>
            </button>

            <span className="text-gray-400 flex-shrink-0 select-none">~</span>

            {/* to input */}
            <button
              ref={toRef}
              type="button"
              disabled={disabled}
              aria-label={toPlaceholder}
              onClick={handleOpenTo}
              className={cn(
                inputVariants({}),
                "flex-1 relative text-left pr-9 cursor-pointer select-none focus:outline-none focus:ring-0 focus:border-gray-300",
                !toDisplay && "text-gray-400",
                toClassName,
              )}
            >
              <span>{toDisplay || toPlaceholder}</span>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <CalendarIcon />
              </span>
            </button>
          </div>

          <Popover.Portal>
            <Popover.Positioner
              anchor={activeInput === "from" ? fromRef : toRef}
              side="bottom"
              align="start"
              sideOffset={4}
            >
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
                  numberOfMonths={1}
                  classNames={calendarClassNames}
                  month={calendarMonth}
                  onMonthChange={setCalendarMonth}
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

DateRangeField.displayName = "DateRangeField"

export { DateRangeField }
export type { DateRangeFieldProps }
