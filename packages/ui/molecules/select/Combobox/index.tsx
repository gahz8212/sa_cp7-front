"use client"

import React, { useState, useMemo, useCallback } from "react"
import { Combobox as BaseCombobox } from "@base-ui/react/combobox"
import { Chip } from "../../../atoms/Chip"
import { Icon } from "../../../atoms/Icon"
import { cn } from "../../../lib/utils"
import { inputVariants } from "../../../atoms/Input"
import type {
  ComboboxProps,
  ComboboxOption,
  SingleComboboxProps,
  MultipleComboboxProps,
} from "./types"

const ChevronDownIcon = () => (
  <Icon size="sm">
    <polyline points="6 9 12 15 18 9" />
  </Icon>
)

const XIcon = () => (
  <Icon size="xs">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </Icon>
)

const CheckIcon = () => (
  <Icon size="xs">
    <polyline points="20 6 9 17 4 12" />
  </Icon>
)

const statusStyles: Record<string, string> = {
  default: "border-gray-300 focus-within:border-blue-500 focus-within:ring-blue-500",
  error: "border-red-500 focus-within:border-red-500 focus-within:ring-red-500",
  success: "border-green-500 focus-within:border-green-500 focus-within:ring-green-500",
}

const sizeStyles: Record<string, string> = {
  sm: "min-h-8 px-3 text-sm",
  md: "min-h-10 px-3 text-sm",
}

function ComboboxInner<T>(props: ComboboxProps<T>, ref: React.ForwardedRef<HTMLDivElement>) {
  const {
    options,
    multiple,
    maxCount,
    clearable = false,
    emptyText,
    placeholder = "선택하세요",
    disabled = false,
    status = "default",
    size = "md",
    className,
    popupClassName,
  } = props

  const value = useMemo(
    () => (multiple ? (props.value ?? []) : props.value),
    [multiple, props.value],
  )
  const onChange = props.onChange

  const [searchValue, setSearchValue] = useState("")
  const [open, setOpen] = useState(false)

  const resolvedEmptyText = emptyText ?? "검색 결과가 없습니다"

  const filteredOptions = useMemo(() => {
    if (!searchValue.trim()) return options
    const lower = searchValue.toLowerCase()
    return options.filter((opt) => opt.label.toLowerCase().includes(lower))
  }, [options, searchValue])

  const getLabelForValue = useCallback(
    (val: T): string => options.find((opt) => opt.value === val)?.label ?? String(val),
    [options],
  )

  const selectedValues: T[] = multiple ? (value as T[]) : []
  const displayedChips = maxCount !== undefined ? selectedValues.slice(0, maxCount) : selectedValues
  const overflowCount = maxCount !== undefined ? Math.max(0, selectedValues.length - maxCount) : 0

  const hasValue = multiple ? (value as T[]).length > 0 : value != null

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (multiple) {
        ;(onChange as (v: T[]) => void)?.([])
      } else {
        ;(onChange as (v: T | null) => void)?.(null)
      }
    },
    [multiple, onChange],
  )

  const handleChipRemove = useCallback(
    (val: T) => () => {
      const newValues = (value as T[]).filter((v) => v !== val)
      ;(onChange as (v: T[]) => void)?.(newValues)
    },
    [value, onChange],
  )

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.nativeEvent.isComposing) return
      if (e.key !== "Enter" || filteredOptions.length !== 1) return
      const opt = filteredOptions[0]
      if (opt.disabled) return
      e.preventDefault()
      if (multiple) {
        const currentValues = value as T[]
        const isSelected = currentValues.some((v) => v === opt.value)
        const newValues = isSelected
          ? currentValues.filter((v) => v !== opt.value)
          : [...currentValues, opt.value as T]
        ;(onChange as (v: T[]) => void)?.(newValues)
        setSearchValue("")
      } else {
        ;(onChange as (v: T | null) => void)?.(opt.value as T)
        setSearchValue("")
        setOpen(false)
      }
    },
    [filteredOptions, multiple, value, onChange],
  )

  return (
    <div ref={ref} className="w-full">
      <BaseCombobox.Root
        value={value as never}
        onValueChange={onChange as never}
        multiple={multiple as never}
        disabled={disabled}
        open={open}
        onOpenChange={(o) => {
          setOpen(o)
          if (!o) setSearchValue("")
        }}
      >
        <div className="relative w-full">
          {multiple ? (
            /* Multiple mode: InputGroup with inline chips + search input */
            <BaseCombobox.InputGroup
              onClick={(e) => (e.currentTarget.querySelector("input") as HTMLInputElement)?.focus()}
              className={cn(
                "flex flex-wrap items-center gap-1 w-full rounded-md border bg-white transition-colors cursor-text py-1.5",
                "focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-0",
                statusStyles[status],
                sizeStyles[size],
                disabled && "opacity-50 cursor-not-allowed pointer-events-none",
                clearable && hasValue ? "pr-16" : "pr-10",
                className,
              )}
            >
              {displayedChips.map((val) => (
                <Chip
                  key={String(val)}
                  size="sm"
                  onRemove={!disabled ? handleChipRemove(val) : undefined}
                >
                  {getLabelForValue(val)}
                </Chip>
              ))}
              {overflowCount > 0 && <Chip size="sm">+{overflowCount}</Chip>}
              <BaseCombobox.Input
                value={searchValue}
                placeholder={!hasValue ? placeholder : undefined}
                onInput={(e) => setSearchValue((e.target as HTMLInputElement).value)}
                onKeyDown={handleInputKeyDown}
                className="flex-1 min-w-[4rem] outline-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400"
              />
            </BaseCombobox.InputGroup>
          ) : (
            /* Single mode: Trigger button */
            <BaseCombobox.Trigger
              className={cn(
                inputVariants({ size, status }),
                "w-full text-left cursor-pointer select-none",
                "focus:outline-none focus:ring-0",
                !hasValue && "text-gray-400",
                clearable && hasValue ? "pr-16" : "pr-10",
                className,
              )}
            >
              <span>{hasValue ? getLabelForValue(value as T) : placeholder}</span>
            </BaseCombobox.Trigger>
          )}

          {/* Right side: clear button + chevron */}
          <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-gray-400 pointer-events-none">
            {clearable && hasValue && !disabled && (
              <button
                type="button"
                aria-label="초기화"
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600 transition-colors pointer-events-auto"
              >
                <XIcon />
              </button>
            )}
            <ChevronDownIcon />
          </span>
        </div>

        {/* Dropdown popup */}
        <BaseCombobox.Portal>
          <BaseCombobox.Positioner side="bottom" align="start" sideOffset={4}>
            <BaseCombobox.Popup
              className={cn(
                "z-50 min-w-[var(--anchor-width)] rounded-lg border border-gray-200 bg-white shadow-md outline-none overflow-hidden",
                "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 transition-opacity duration-150",
                popupClassName,
              )}
            >
              {/* Search input inside popup — single mode only */}
              {!multiple && (
                <div className="border-b border-gray-100 px-3 py-2">
                  <BaseCombobox.Input
                    value={searchValue}
                    placeholder="검색..."
                    onInput={(e) => setSearchValue((e.target as HTMLInputElement).value)}
                    onKeyDown={handleInputKeyDown}
                    className="w-full outline-none text-sm text-gray-900 placeholder:text-gray-400 bg-transparent"
                  />
                </div>
              )}

              {/* Options list */}
              <BaseCombobox.List className="max-h-60 overflow-y-auto p-1">
                {filteredOptions.map((opt) => (
                  <BaseCombobox.Item
                    key={String(opt.value)}
                    value={opt.value as never}
                    disabled={opt.disabled}
                    className={cn(
                      "relative flex w-full cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm text-gray-900 outline-none",
                      "hover:bg-gray-100 data-[highlighted]:bg-gray-100",
                      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                    )}
                  >
                    <span className="mr-2 h-4 w-4 flex items-center justify-center flex-shrink-0">
                      <BaseCombobox.ItemIndicator>
                        <CheckIcon />
                      </BaseCombobox.ItemIndicator>
                    </span>
                    {opt.label}
                  </BaseCombobox.Item>
                ))}
                {filteredOptions.length === 0 && (
                  <BaseCombobox.Empty className="py-6 text-center text-sm text-gray-500">
                    {resolvedEmptyText}
                  </BaseCombobox.Empty>
                )}
              </BaseCombobox.List>
            </BaseCombobox.Popup>
          </BaseCombobox.Positioner>
        </BaseCombobox.Portal>
      </BaseCombobox.Root>
    </div>
  )
}

type ComboboxComponent = {
  <T>(
    props: SingleComboboxProps<T> & { ref?: React.Ref<HTMLDivElement> },
  ): React.ReactElement | null
  <T>(
    props: MultipleComboboxProps<T> & { ref?: React.Ref<HTMLDivElement> },
  ): React.ReactElement | null
}

const Combobox = React.forwardRef(ComboboxInner) as unknown as ComboboxComponent

export { Combobox }
export type { ComboboxProps, ComboboxOption }
