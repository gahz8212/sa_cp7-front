"use client"

import React, { useState, useCallback, useMemo } from "react"
import { format as dateFnsFormat } from "date-fns"
import { Popover } from "@base-ui/react/popover"
import { Button } from "../../../atoms/Button"
import { Icon } from "../../../atoms/Icon"
import { cn } from "../../../lib/utils"
import { inputVariants } from "../../../atoms/Input"
import {
  DEFAULT_LOCALE,
  formatYear,
  formatYearMonth,
  getDefaultYearMonthPlaceholder,
  YEAR_MONTH_PLACEHOLDER_MAP,
} from "../_internal/formats"
import { YearGrid, getDecadeStart } from "../_internal/YearGrid"
import type { YearMonthPickerProps } from "./types"

const CalendarIcon = () => (
  <Icon size="sm">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </Icon>
)

const XIcon = () => (
  <Icon size="xs">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </Icon>
)

const ChevronDownIcon = () => (
  <Icon size="xs">
    <polyline points="6 9 12 15 18 9" />
  </Icon>
)

type View = "month" | "year"

const MONTHS = Array.from({ length: 12 }, (_, i) => i)

const YearMonthPicker = React.forwardRef<HTMLDivElement, YearMonthPickerProps>(
  (
    {
      value,
      onChange,
      format = "dot",
      locale = DEFAULT_LOCALE,
      minDate,
      maxDate,
      disabled = false,
      clearable = false,
      placeholder,
      className,
      calendarClassName,
    },
    ref,
  ) => {
    const [open, setOpen] = useState(false)
    const [view, setView] = useState<View>("month")

    const currentYear = useMemo(() => new Date().getFullYear(), [])
    const effectiveMinYear = minDate?.getFullYear() ?? currentYear - 100
    const effectiveMaxYear = maxDate?.getFullYear() ?? currentYear + 10

    const getInitialYear = useCallback(() => {
      if (value) return value.getFullYear()
      if (currentYear >= effectiveMinYear && currentYear <= effectiveMaxYear) return currentYear
      return effectiveMinYear
    }, [value, currentYear, effectiveMinYear, effectiveMaxYear])

    const [selectedYear, setSelectedYear] = useState(getInitialYear)
    const [decadeStart, setDecadeStart] = useState(() => getDecadeStart(getInitialYear()))

    const resolvedPlaceholder = placeholder ?? getDefaultYearMonthPlaceholder(locale)
    const displayValue = value ? formatYearMonth(value, format) : ""

    const handleOpenChange = useCallback(
      (o: boolean) => {
        setOpen(o)
        if (o) {
          setView("month")
          const year = getInitialYear()
          setSelectedYear(year)
          setDecadeStart(getDecadeStart(year))
        }
      },
      [getInitialYear],
    )

    const handleYearSelect = useCallback((year: number) => {
      setSelectedYear(year)
      setView("month")
    }, [])

    const handleMonthSelect = useCallback(
      (monthIndex: number) => {
        onChange?.(new Date(selectedYear, monthIndex, 1, 12, 0, 0))
        setOpen(false)
      },
      [selectedYear, onChange],
    )

    const handleClear = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation()
        onChange?.(undefined)
      },
      [onChange],
    )

    const isMonthDisabled = useCallback(
      (monthIndex: number) => {
        const d = new Date(selectedYear, monthIndex, 1)
        if (minDate && d < new Date(minDate.getFullYear(), minDate.getMonth(), 1)) return true
        if (maxDate && d > new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)) return true
        return false
      },
      [selectedYear, minDate, maxDate],
    )

    return (
      <div ref={ref} className="w-full">
        <Popover.Root open={open} onOpenChange={handleOpenChange}>
          <div className="relative w-full">
            <Popover.Trigger
              render={<button type="button" disabled={disabled} aria-label={resolvedPlaceholder} />}
              className={cn(
                inputVariants({}),
                "w-full text-left cursor-pointer select-none focus:outline-none focus:ring-0 focus:border-gray-300",
                clearable && value ? "pr-16" : "pr-10",
                !displayValue && "text-gray-400",
                disabled && "opacity-50",
                className,
              )}
            >
              <span>{displayValue || resolvedPlaceholder}</span>
            </Popover.Trigger>

            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex items-center gap-1">
              {clearable && value && (
                <button
                  type="button"
                  aria-label="초기화"
                  disabled={disabled}
                  onClick={handleClear}
                  className="text-gray-400 hover:text-gray-600 transition-colors pointer-events-auto"
                >
                  <XIcon />
                </button>
              )}
              <CalendarIcon />
            </span>
          </div>

          <Popover.Portal>
            <Popover.Positioner side="bottom" align="start" sideOffset={4}>
              <Popover.Popup
                className={cn(
                  "z-50 rounded-lg border border-gray-200 bg-white shadow-md outline-none p-3",
                  "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 transition-opacity duration-150",
                  calendarClassName,
                )}
              >
                {view === "year" ? (
                  <YearGrid
                    decadeStart={decadeStart}
                    selectedYear={selectedYear}
                    effectiveMinYear={effectiveMinYear}
                    effectiveMaxYear={effectiveMaxYear}
                    locale={locale}
                    onYearSelect={handleYearSelect}
                    onDecadeChange={setDecadeStart}
                  />
                ) : (
                  <div>
                    {/* 헤더: 년도 클릭 시 년도 그리드로 전환 */}
                    <div className="flex items-center justify-center mb-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setView("year")}
                        className="flex items-center gap-1 h-7 px-2 text-sm font-medium text-gray-700"
                      >
                        {formatYear(selectedYear, locale)}
                        <ChevronDownIcon />
                      </Button>
                    </div>

                    {/* 월 그리드 (3열 4행) */}
                    <div className="grid grid-cols-3 gap-1">
                      {MONTHS.map((monthIndex) => {
                        const monthDisabled = isMonthDisabled(monthIndex)
                        const isSelected =
                          value &&
                          value.getFullYear() === selectedYear &&
                          value.getMonth() === monthIndex
                        return (
                          <Button
                            key={monthIndex}
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={monthDisabled}
                            onClick={() => handleMonthSelect(monthIndex)}
                            className={cn(
                              "h-9 w-full text-sm",
                              isSelected && "bg-blue-600 text-white hover:bg-blue-700",
                            )}
                          >
                            {dateFnsFormat(new Date(selectedYear, monthIndex, 1), "MMM", { locale })}
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </div>
    )
  },
)

YearMonthPicker.displayName = "YearMonthPicker"

export { YearMonthPicker }
export type { YearMonthPickerProps }
