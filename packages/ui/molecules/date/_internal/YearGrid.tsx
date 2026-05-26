"use client"

import React, { useMemo } from "react"
import type { Locale } from "date-fns"
import { Button } from "../../../atoms/Button"
import { Icon } from "../../../atoms/Icon"
import { cn } from "../../../lib/utils"
import { formatYear } from "./formats"

export const getDecadeStart = (year: number) => Math.floor(year / 10) * 10

const ChevronLeftIcon = () => (
  <Icon size="sm">
    <polyline points="15 18 9 12 15 6" />
  </Icon>
)

const ChevronRightIcon = () => (
  <Icon size="sm">
    <polyline points="9 18 15 12 9 6" />
  </Icon>
)

type YearGridProps = {
  decadeStart: number
  selectedYear?: number
  effectiveMinYear: number
  effectiveMaxYear: number
  locale: Locale
  onYearSelect: (year: number) => void
  onDecadeChange: (decadeStart: number) => void
}

const YearGrid = ({
  decadeStart,
  selectedYear,
  effectiveMinYear,
  effectiveMaxYear,
  locale,
  onYearSelect,
  onDecadeChange,
}: YearGridProps) => {
  const years = useMemo(
    () => Array.from({ length: 10 }, (_, i) => decadeStart + i),
    [decadeStart],
  )

  const isPrevDisabled = decadeStart <= getDecadeStart(effectiveMinYear)
  const isNextDisabled = decadeStart + 10 > effectiveMaxYear

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isPrevDisabled}
          onClick={() => onDecadeChange(decadeStart - 10)}
          aria-label="이전 decade"
          className="h-7 w-7 p-0"
        >
          <ChevronLeftIcon />
        </Button>

        <span className="text-sm font-medium text-gray-700">
          {decadeStart} - {decadeStart + 9}
        </span>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isNextDisabled}
          onClick={() => onDecadeChange(decadeStart + 10)}
          aria-label="다음 decade"
          className="h-7 w-7 p-0"
        >
          <ChevronRightIcon />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-1">
        {years.map((year) => {
          const isDisabled = year < effectiveMinYear || year > effectiveMaxYear
          const isSelected = selectedYear === year
          return (
            <Button
              key={year}
              type="button"
              variant="ghost"
              size="sm"
              disabled={isDisabled}
              onClick={() => onYearSelect(year)}
              className={cn(
                "h-9 w-full text-sm",
                isSelected && "bg-blue-600 text-white hover:bg-blue-700",
              )}
            >
              {formatYear(year, locale)}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

export { YearGrid }
