"use client"

import React, { useState, useCallback, useMemo } from "react"
import { Popover } from "@base-ui/react/popover"
import { Icon } from "../../../atoms/Icon"
import { cn } from "../../../lib/utils"
import { inputVariants } from "../../../atoms/Input"
import { DEFAULT_LOCALE, formatYear, getDefaultYearPlaceholder } from "../_internal/formats"
import { YearGrid, getDecadeStart } from "../_internal/YearGrid"
import type { YearPickerProps } from "./types"

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

const YearPicker = React.forwardRef<HTMLDivElement, YearPickerProps>(
  (
    {
      value,
      onChange,
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

    const currentYear = useMemo(() => new Date().getFullYear(), [])
    const effectiveMinYear = minDate?.getFullYear() ?? currentYear - 100
    const effectiveMaxYear = maxDate?.getFullYear() ?? currentYear + 10

    const resolvedPlaceholder = placeholder ?? getDefaultYearPlaceholder(locale)
    const displayValue = value !== undefined ? formatYear(value, locale) : ""

    const getInitialDecadeStart = useCallback(() => {
      if (value !== undefined) return getDecadeStart(value)
      if (currentYear >= effectiveMinYear && currentYear <= effectiveMaxYear) {
        return getDecadeStart(currentYear)
      }
      return getDecadeStart(effectiveMinYear)
    }, [value, currentYear, effectiveMinYear, effectiveMaxYear])

    const [decadeStart, setDecadeStart] = useState(getInitialDecadeStart)

    const handleOpenChange = useCallback(
      (o: boolean) => {
        setOpen(o)
        if (o) setDecadeStart(getInitialDecadeStart())
      },
      [getInitialDecadeStart],
    )

    const handleYearSelect = useCallback(
      (year: number) => {
        onChange?.(year)
        setOpen(false)
      },
      [onChange],
    )

    const handleClear = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation()
        onChange?.(undefined)
      },
      [onChange],
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
                clearable && value !== undefined ? "pr-16" : "pr-10",
                !displayValue && "text-gray-400",
                disabled && "opacity-50",
                className,
              )}
            >
              <span>{displayValue || resolvedPlaceholder}</span>
            </Popover.Trigger>

            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex items-center gap-1">
              {clearable && value !== undefined && (
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
                <YearGrid
                  decadeStart={decadeStart}
                  selectedYear={value}
                  effectiveMinYear={effectiveMinYear}
                  effectiveMaxYear={effectiveMaxYear}
                  locale={locale}
                  onYearSelect={handleYearSelect}
                  onDecadeChange={setDecadeStart}
                />
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </div>
    )
  },
)

YearPicker.displayName = "YearPicker"

export { YearPicker }
export type { YearPickerProps }
