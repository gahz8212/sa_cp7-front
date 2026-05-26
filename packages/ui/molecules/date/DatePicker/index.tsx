"use client"

import React, { useRef, useState, useCallback, useMemo } from "react"
import { Popover } from "@base-ui/react/popover"
import { DayPicker } from "react-day-picker"
import { IMaskInput } from "react-imask"
import { cn } from "../../../lib/utils"
import { inputVariants } from "../../../atoms/Input"
import {
  MASK_MAP,
  PLACEHOLDER_MAP,
  DEFAULT_LOCALE,
  formatDate,
  parseDate,
} from "../_internal/formats"
import { calendarClassNames } from "../_internal/styles"
import type { DatePickerProps } from "./types"

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

const XIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const DatePicker = React.forwardRef<HTMLDivElement, DatePickerProps>(
  (
    {
      value,
      onChange,
      format = "dot",
      placeholder,
      locale = DEFAULT_LOCALE,
      editable = false,
      clearable = false,
      minDate,
      maxDate,
      disabled = false,
      status = "default",
      captionLayout = "label",
      className,
      calendarClassName,
      id,
      name,
    },
    ref,
  ) => {
    const [open, setOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const displayValue = useMemo(() => (value ? formatDate(value, format) : ""), [value, format])
    const resolvedPlaceholder = placeholder ?? PLACEHOLDER_MAP[format]

    const [inputValue, setInputValue] = useState(displayValue)
    const [inputError, setInputError] = useState(false)
    const [prevValue, setPrevValue] = useState(value)

    if (prevValue !== value) {
      setPrevValue(value)
      setInputValue(displayValue)
      setInputError(false)
    }

    const handleDaySelect = useCallback(
      (date: Date | undefined) => {
        onChange?.(date)
        setOpen(false)
      },
      [onChange],
    )

    const handleMaskComplete = useCallback(
      (val: string) => {
        const parsed = parseDate(val, format)
        if (parsed) {
          setInputError(false)
          onChange?.(parsed)
        } else {
          setInputError(true)
        }
      },
      [format, onChange],
    )

    const handleMaskAccept = useCallback(
      (val: string) => {
        setInputValue(val)
        if (!val) {
          setInputError(false)
          onChange?.(undefined)
        }
      },
      [onChange],
    )

    const handleInputBlur = useCallback(() => {
      if (inputError) {
        setInputValue(displayValue)
        setInputError(false)
      }
    }, [inputError, displayValue])

    const disabledMatcher = [
      ...(minDate ? [{ before: minDate }] : []),
      ...(maxDate ? [{ after: maxDate }] : []),
    ]

    const hasYearDropdown = captionLayout === "dropdown" || captionLayout === "dropdown-years"
    const defaultEndMonth = useMemo(() => {
      if (!hasYearDropdown) return undefined
      const d = new Date()
      d.setFullYear(d.getFullYear() + 10)
      return d
    }, [hasYearDropdown])

    const resolvedStatus = inputError ? "error" : status

    return (
      <div ref={ref} className="w-full">
        <Popover.Root open={open} onOpenChange={setOpen}>
          {editable ? (
            <div ref={containerRef} className="relative w-full">
              <IMaskInput
                mask={MASK_MAP[format]}
                value={inputValue}
                onAccept={handleMaskAccept}
                onComplete={handleMaskComplete}
                onBlur={handleInputBlur}
                placeholder={resolvedPlaceholder}
                disabled={disabled}
                id={id}
                name={name}
                className={cn(inputVariants({ status: resolvedStatus }), "pr-16", className)}
              />
              {clearable && value && (
                <button
                  type="button"
                  aria-label="날짜 초기화"
                  disabled={disabled}
                  onClick={() => onChange?.(undefined)}
                  className={cn(
                    "absolute right-9 top-1/2 -translate-y-1/2",
                    "h-6 w-6 flex items-center justify-center rounded",
                    "text-gray-400 hover:text-gray-600 transition-colors",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                  )}
                >
                  <XIcon />
                </button>
              )}
              <Popover.Trigger
                render={<button type="button" aria-label="달력 열기" disabled={disabled} />}
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2",
                  "h-6 w-6 flex items-center justify-center rounded",
                  "text-gray-400 hover:text-gray-600 transition-colors",
                  "focus:outline-none focus:ring-0",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                )}
              >
                <CalendarIcon />
              </Popover.Trigger>
            </div>
          ) : (
            <div className="relative w-full">
              <Popover.Trigger
                render={<button type="button" disabled={disabled} aria-label={resolvedPlaceholder} />}
                className={cn(
                  inputVariants({ status }),
                  "w-full text-left cursor-pointer select-none focus:outline-none focus:ring-0 focus:border-gray-300",
                  clearable && value ? "pr-16" : "pr-10",
                  !displayValue && "text-gray-400",
                  disabled && "opacity-50",
                  className,
                )}
              >
                <span>{displayValue || resolvedPlaceholder}</span>
                {name && <input type="hidden" name={name} value={displayValue} />}
              </Popover.Trigger>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex items-center gap-1">
                {clearable && value && (
                  <button
                    type="button"
                    aria-label="날짜 초기화"
                    disabled={disabled}
                    onClick={() => onChange?.(undefined)}
                    className="text-gray-400 hover:text-gray-600 transition-colors pointer-events-auto"
                  >
                    <XIcon />
                  </button>
                )}
                <CalendarIcon />
              </span>
            </div>
          )}

          <Popover.Portal>
            <Popover.Positioner
              anchor={editable ? containerRef : undefined}
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
                  mode="single"
                  required
                  selected={value}
                  onSelect={handleDaySelect}
                  locale={locale}
                  disabled={disabledMatcher.length > 0 ? disabledMatcher : undefined}
                  classNames={calendarClassNames}
                  defaultMonth={value}
                  captionLayout={captionLayout}
                  endMonth={defaultEndMonth}
                  fixedWeeks
                  formatters={{
                    formatYearDropdown: (year, dateLib) => `${dateLib?.format(year, "yyyy") ?? year.getFullYear()}년`,
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

DatePicker.displayName = "DatePicker"

export { DatePicker }
export type { DatePickerProps }
