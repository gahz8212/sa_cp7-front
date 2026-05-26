"use client"

import { useState } from "react"
import { DatePicker, DateRangePicker, DateRangeField, YearPicker, YearMonthPicker, Heading, Divider, Text, Link } from "@cp7/ui"
import type { DateRange } from "@cp7/ui"

const SECTION = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-12">
    <h2 className="mb-4 text-xl font-bold text-gray-800 border-b pb-2">{title}</h2>
    <div className="space-y-6">{children}</div>
  </section>
)

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <p className="mb-2 text-xs text-gray-500">{label}</p>
    <div className="flex flex-wrap items-start gap-4">{children}</div>
  </div>
)

const ValueDisplay = ({ value }: { value: unknown }) => (
  <p className="mt-2 text-xs text-gray-400 font-mono">
    {value === undefined || value === null
      ? "undefined"
      : value instanceof Date
        ? value.toISOString().slice(0, 10)
        : JSON.stringify(
            value,
            (_, v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v),
            2,
          )}
  </p>
)

export default function DateTestPage() {
  // DatePicker
  const [date, setDate] = useState<Date | undefined>()
  const [dateEditable, setDateEditable] = useState<Date | undefined>()
  const [dateDash, setDateDash] = useState<Date | undefined>()
  const [dateDisabled, setDateDisabled] = useState<Date | undefined>(new Date(2026, 3, 15))
  const [dateBounded, setDateBounded] = useState<Date | undefined>()
  const [dateClearable, setDateClearable] = useState<Date | undefined>()
  const [dateClearableEditable, setDateClearableEditable] = useState<Date | undefined>()
  const [dateCaptionDropdown, setDateCaptionDropdown] = useState<Date | undefined>()
  const [dateCaptionMonths, setDateCaptionMonths] = useState<Date | undefined>()
  const [dateCaptionYears, setDateCaptionYears] = useState<Date | undefined>()

  // YearPicker
  const [year, setYear] = useState<number | undefined>()
  const [yearClearable, setYearClearable] = useState<number | undefined>(2024)
  const [yearBounded, setYearBounded] = useState<number | undefined>()
  const [yearDisabled, setYearDisabled] = useState<number | undefined>(2026)

  // YearMonthPicker
  const [yearMonth, setYearMonth] = useState<Date | undefined>()
  const [yearMonthClearable, setYearMonthClearable] = useState<Date | undefined>(new Date(2024, 4, 1))
  const [yearMonthBounded, setYearMonthBounded] = useState<Date | undefined>()
  const [yearMonthDash, setYearMonthDash] = useState<Date | undefined>()
  const [yearMonthDisabled, setYearMonthDisabled] = useState<Date | undefined>(new Date(2026, 4, 1))

  // DateRangePicker
  const [range, setRange] = useState<DateRange | undefined>()
  const [rangeDash, setRangeDash] = useState<DateRange | undefined>()
  const [rangeReverse, setRangeReverse] = useState<DateRange | undefined>()
  const [rangeSameDay, setRangeSameDay] = useState<DateRange | undefined>()
  const [rangeBounded, setRangeBounded] = useState<DateRange | undefined>()
  const [rangeSingle, setRangeSingle] = useState<DateRange | undefined>()
  const [rangeCaptionDropdown, setRangeCaptionDropdown] = useState<DateRange | undefined>()
  const [rangeCaptionMonths, setRangeCaptionMonths] = useState<DateRange | undefined>()
  const [rangeCaptionYears, setRangeCaptionYears] = useState<DateRange | undefined>()

  // DateRangeField
  const [fieldRange, setFieldRange] = useState<DateRange | undefined>()
  const [fieldRangeBounded, setFieldRangeBounded] = useState<DateRange | undefined>()
  const [fieldRangeFrom, setFieldRangeFrom] = useState<DateRange | undefined>()
  const [fieldRangeTo, setFieldRangeTo] = useState<DateRange | undefined>({ from: new Date(2026, 3, 10), to: undefined })
  const [fieldCaptionDropdown, setFieldCaptionDropdown] = useState<DateRange | undefined>()
  const [fieldCaptionMonths, setFieldCaptionMonths] = useState<DateRange | undefined>()
  const [fieldCaptionYears, setFieldCaptionYears] = useState<DateRange | undefined>()

  const today = new Date()
  const minDate = new Date(today.getFullYear(), today.getMonth(), 1)
  const maxDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-6">
        <Link href="/test" variant="muted">← 테스트 목록</Link>
      </div>
      <Heading level={1} className="mb-8">
        UI Kit — Date Molecules
      </Heading>

      {/* YearPicker */}
      <SECTION title="YearPicker">
        <Row label="기본">
          <div className="w-48">
            <YearPicker value={year} onChange={setYear} />
            <ValueDisplay value={year} />
          </div>
        </Row>

        <Row label="clearable (초기값: 2024)">
          <div className="w-48">
            <YearPicker value={yearClearable} onChange={setYearClearable} clearable />
            <ValueDisplay value={yearClearable} />
          </div>
        </Row>

        <Row label="minDate / maxDate (2020~2027)">
          <div className="w-48">
            <YearPicker
              value={yearBounded}
              onChange={setYearBounded}
              minDate={new Date(2020, 0, 1)}
              maxDate={new Date(2027, 11, 31)}
            />
            <ValueDisplay value={yearBounded} />
          </div>
        </Row>

        <Row label="disabled">
          <div className="w-48">
            <YearPicker value={yearDisabled} onChange={setYearDisabled} disabled />
            <ValueDisplay value={yearDisabled} />
          </div>
        </Row>
      </SECTION>

      <Divider />

      {/* YearMonthPicker */}
      <SECTION title="YearMonthPicker">
        <Row label="기본 (format: dot)">
          <div className="w-48">
            <YearMonthPicker value={yearMonth} onChange={setYearMonth} />
            <ValueDisplay value={yearMonth} />
          </div>
        </Row>

        <Row label="clearable (초기값: 2024.05)">
          <div className="w-48">
            <YearMonthPicker value={yearMonthClearable} onChange={setYearMonthClearable} clearable />
            <ValueDisplay value={yearMonthClearable} />
          </div>
        </Row>

        <Row label="minDate / maxDate (2024.03 ~ 2026.09) — 월 disabled 확인">
          <div className="w-48">
            <YearMonthPicker
              value={yearMonthBounded}
              onChange={setYearMonthBounded}
              minDate={new Date(2024, 2, 1)}
              maxDate={new Date(2026, 8, 1)}
            />
            <ValueDisplay value={yearMonthBounded} />
          </div>
        </Row>

        <Row label="format: dash">
          <div className="w-48">
            <YearMonthPicker value={yearMonthDash} onChange={setYearMonthDash} format="dash" />
            <ValueDisplay value={yearMonthDash} />
          </div>
        </Row>

        <Row label="disabled">
          <div className="w-48">
            <YearMonthPicker value={yearMonthDisabled} onChange={setYearMonthDisabled} disabled />
            <ValueDisplay value={yearMonthDisabled} />
          </div>
        </Row>
      </SECTION>

      <Divider />

      {/* DatePicker */}
      <SECTION title="DatePicker">
        <Row label="기본 (format: dot, non-editable)">
          <div className="w-64">
            <DatePicker value={date} onChange={setDate} />
            <ValueDisplay value={date} />
          </div>
        </Row>

        <Row label="editable (마스크 입력, format: dot)">
          <div className="w-64">
            <DatePicker value={dateEditable} onChange={setDateEditable} editable />
            <ValueDisplay value={dateEditable} />
          </div>
        </Row>

        <Row label="format: dash">
          <div className="w-64">
            <DatePicker value={dateDash} onChange={setDateDash} format="dash" />
            <ValueDisplay value={dateDash} />
          </div>
        </Row>

        <Row label="disabled">
          <div className="w-64">
            <DatePicker value={dateDisabled} onChange={setDateDisabled} disabled />
            <ValueDisplay value={dateDisabled} />
          </div>
        </Row>

        <Row label="minDate / maxDate (이번 달 범위)">
          <div className="w-64">
            <DatePicker
              value={dateBounded}
              onChange={setDateBounded}
              minDate={minDate}
              maxDate={maxDate}
              placeholder="이번 달만 선택 가능"
            />
            <ValueDisplay value={dateBounded} />
          </div>
        </Row>

        <Row label="clearable (non-editable)">
          <div className="w-64">
            <DatePicker value={dateClearable} onChange={setDateClearable} clearable />
            <ValueDisplay value={dateClearable} />
          </div>
        </Row>

        <Row label="clearable + editable">
          <div className="w-64">
            <DatePicker
              value={dateClearableEditable}
              onChange={setDateClearableEditable}
              clearable
              editable
            />
            <ValueDisplay value={dateClearableEditable} />
          </div>
        </Row>

        <Row label="captionLayout: dropdown (년+월 드롭다운)">
          <div className="w-64">
            <DatePicker
              value={dateCaptionDropdown}
              onChange={setDateCaptionDropdown}
              captionLayout="dropdown"
            />
            <ValueDisplay value={dateCaptionDropdown} />
          </div>
        </Row>

        <Row label="captionLayout: dropdown-months (월만 드롭다운)">
          <div className="w-64">
            <DatePicker
              value={dateCaptionMonths}
              onChange={setDateCaptionMonths}
              captionLayout="dropdown-months"
            />
            <ValueDisplay value={dateCaptionMonths} />
          </div>
        </Row>

        <Row label="captionLayout: dropdown-years (년만 드롭다운)">
          <div className="w-64">
            <DatePicker
              value={dateCaptionYears}
              onChange={setDateCaptionYears}
              captionLayout="dropdown-years"
            />
            <ValueDisplay value={dateCaptionYears} />
          </div>
        </Row>
      </SECTION>

      <Divider />

      {/* DateRangePicker */}
      <SECTION title="DateRangePicker (단일 Input, 필터용)">
        <Row label="기본 (format: dot, numberOfMonths: 2)">
          <div className="w-80">
            <DateRangePicker value={range} onChange={setRange} />
            <ValueDisplay value={range} />
          </div>
        </Row>

        <Row label="역순 클릭 검증 — 나중 날짜 먼저 클릭 후 앞 날짜 클릭 → from < to 자동 교환">
          <div className="w-80">
            <DateRangePicker value={rangeReverse} onChange={setRangeReverse} />
            <ValueDisplay value={rangeReverse} />
          </div>
        </Row>

        <Row label="같은 날짜 두 번 클릭 → from === to (당일 1일 범위)">
          <div className="w-80">
            <DateRangePicker value={rangeSameDay} onChange={setRangeSameDay} />
            <ValueDisplay value={rangeSameDay} />
          </div>
        </Row>

        <Row label="minDate / maxDate (이번 달 범위만 선택 가능)">
          <div className="w-80">
            <DateRangePicker
              value={rangeBounded}
              onChange={setRangeBounded}
              minDate={minDate}
              maxDate={maxDate}
            />
            <ValueDisplay value={rangeBounded} />
          </div>
        </Row>

        <Row label="numberOfMonths: 1 (단일 월)">
          <div className="w-80">
            <DateRangePicker value={rangeSingle} onChange={setRangeSingle} numberOfMonths={1} />
            <ValueDisplay value={rangeSingle} />
          </div>
        </Row>

        <Row label="format: dash">
          <div className="w-80">
            <DateRangePicker value={rangeDash} onChange={setRangeDash} format="dash" />
            <ValueDisplay value={rangeDash} />
          </div>
        </Row>

        <Row label="disabled">
          <div className="w-80">
            <DateRangePicker
              value={{ from: new Date(2026, 3, 1), to: new Date(2026, 3, 30) }}
              onChange={() => {}}
              disabled
            />
          </div>
        </Row>

        <Row label="captionLayout: dropdown — 달력 1개, 재오픈 시 from 월 표시, draftRange 초기화">
          <div className="w-80">
            <DateRangePicker
              value={rangeCaptionDropdown}
              onChange={setRangeCaptionDropdown}
              captionLayout="dropdown"
            />
            <ValueDisplay value={rangeCaptionDropdown} />
          </div>
        </Row>

        <Row label="captionLayout: dropdown-months (월만 드롭다운)">
          <div className="w-80">
            <DateRangePicker
              value={rangeCaptionMonths}
              onChange={setRangeCaptionMonths}
              captionLayout="dropdown-months"
            />
            <ValueDisplay value={rangeCaptionMonths} />
          </div>
        </Row>

        <Row label="captionLayout: dropdown-years (년만 드롭다운)">
          <div className="w-80">
            <DateRangePicker
              value={rangeCaptionYears}
              onChange={setRangeCaptionYears}
              captionLayout="dropdown-years"
            />
            <ValueDisplay value={rangeCaptionYears} />
          </div>
        </Row>
      </SECTION>

      <Divider />

      {/* DateRangeField */}
      <SECTION title="DateRangeField (두 Input, 폼용)">
        <Row label="기본 (format: dot) — from/to 인풋 각각 클릭해서 팝업 위치 확인">
          <div className="w-full max-w-md">
            <DateRangeField value={fieldRange} onChange={setFieldRange} />
            <ValueDisplay value={fieldRange} />
          </div>
        </Row>

        <Row label="재오픈 시 기존 선택값 표시 — 날짜 선택 후 다시 클릭해서 range 하이라이트 확인">
          <div className="w-full max-w-md">
            <DateRangeField value={fieldRangeFrom} onChange={setFieldRangeFrom} />
            <ValueDisplay value={fieldRangeFrom} />
          </div>
        </Row>

        <Row label="to 인풋 클릭 시 from 고정 검증 — from 선택 후 to 인풋 클릭 → from 이전 날짜 비활성화 확인">
          <div className="w-full max-w-md">
            <DateRangeField value={fieldRangeTo} onChange={setFieldRangeTo} />
            <ValueDisplay value={fieldRangeTo} />
          </div>
        </Row>

        <Row label="minDate / maxDate (이번 달 범위) + 동적 min/max 합산">
          <div className="w-full max-w-md">
            <DateRangeField
              value={fieldRangeBounded}
              onChange={setFieldRangeBounded}
              minDate={minDate}
              maxDate={maxDate}
            />
            <ValueDisplay value={fieldRangeBounded} />
          </div>
        </Row>

        <Row label="커스텀 placeholder">
          <div className="w-full max-w-md">
            <DateRangeField
              value={fieldRange}
              onChange={setFieldRange}
              placeholder={{ from: "시작일", to: "종료일" }}
            />
          </div>
        </Row>

        <Row label="disabled">
          <div className="w-full max-w-md">
            <DateRangeField
              value={{ from: new Date(2026, 3, 1), to: new Date(2026, 3, 30) }}
              onChange={() => {}}
              disabled
            />
          </div>
        </Row>

        <Row label="captionLayout: dropdown — to 클릭 시 to 월 표시 확인">
          <div className="w-full max-w-md">
            <DateRangeField
              value={fieldCaptionDropdown}
              onChange={setFieldCaptionDropdown}
              captionLayout="dropdown"
            />
            <ValueDisplay value={fieldCaptionDropdown} />
          </div>
        </Row>

        <Row label="captionLayout: dropdown-months (월만 드롭다운)">
          <div className="w-full max-w-md">
            <DateRangeField
              value={fieldCaptionMonths}
              onChange={setFieldCaptionMonths}
              captionLayout="dropdown-months"
            />
            <ValueDisplay value={fieldCaptionMonths} />
          </div>
        </Row>

        <Row label="captionLayout: dropdown-years (년만 드롭다운)">
          <div className="w-full max-w-md">
            <DateRangeField
              value={fieldCaptionYears}
              onChange={setFieldCaptionYears}
              captionLayout="dropdown-years"
            />
            <ValueDisplay value={fieldCaptionYears} />
          </div>
        </Row>
      </SECTION>

      <Divider />

      <section className="mb-8">
        <Text size="sm" className="text-gray-400">
          <Link href="/test/ui-kit" variant="muted">← Atoms (/test/ui-kit)</Link>
        </Text>
      </section>
    </main>
  )
}
