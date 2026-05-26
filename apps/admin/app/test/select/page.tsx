"use client"

import { useState } from "react"
import { Combobox, Heading, Text, Divider, Link } from "@cp7/ui"
import type { ComboboxOption } from "@cp7/ui"

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

const fruitOptions: ComboboxOption<string>[] = [
  { value: "apple", label: "사과" },
  { value: "banana", label: "바나나" },
  { value: "cherry", label: "체리" },
  { value: "grape", label: "포도" },
  { value: "aaaa", label: "apple" },
  { value: "mango", label: "망고" },
  { value: "orange", label: "오렌지" },
  { value: "strawberry", label: "딸기", disabled: true },
  { value: "watermelon", label: "수박" },
]

const numericOptions: ComboboxOption<number>[] = [
  { value: 1, label: "첫 번째" },
  { value: 2, label: "두 번째" },
  { value: 3, label: "세 번째" },
  { value: 4, label: "네 번째" },
  { value: 5, label: "다섯 번째" },
]

export default function SelectTestPage() {
  // Single
  const [singleValue, setSingleValue] = useState<string | null>(null)
  const [singleClearable, setSingleClearable] = useState<string | null>("banana")
  const [singleError, setSingleError] = useState<string | null>(null)
  const [singleSuccess, setSingleSuccess] = useState<string | null>("apple")
  const [singleDisabled, setSingleDisabled] = useState<string | null>(null)
  const [singleNumeric, setSingleNumeric] = useState<number | null>(null)

  // Multiple
  const [multiValue, setMultiValue] = useState<string[]>([])
  const [multiWithValues, setMultiWithValues] = useState<string[]>(["apple", "banana", "grape"])
  const [multiMaxCount, setMultiMaxCount] = useState<string[]>([
    "apple",
    "banana",
    "grape",
    "mango",
  ])
  const [multiClearable, setMultiClearable] = useState<string[]>(["apple", "banana"])
  const [multiDisabled, setMultiDisabled] = useState<string[]>(["apple", "banana"])

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-6">
        <Link href="/test" variant="muted">← 테스트 목록</Link>
      </div>
      <Heading level={1} className="mb-8">
        UI Kit — Molecules / Select
      </Heading>

      {/* Single Combobox */}
      <SECTION title="Combobox — Single">
        <Row label="기본 (선택 없음)">
          <div className="w-64">
            <Combobox
              options={fruitOptions}
              value={singleValue}
              onChange={(v) => setSingleValue(v)}
              placeholder="과일 선택"
            />
          </div>
          <Text size="sm" className="text-gray-400 self-center">
            선택값: {singleValue ?? "null"}
          </Text>
        </Row>

        <Row label="clearable (초기값 있음)">
          <div className="w-64">
            <Combobox
              options={fruitOptions}
              value={singleClearable}
              onChange={(v) => setSingleClearable(v)}
              clearable
              placeholder="과일 선택"
            />
          </div>
          <Text size="sm" className="text-gray-400 self-center">
            선택값: {singleClearable ?? "null"}
          </Text>
        </Row>

        <Row label="size sm">
          <div className="w-48">
            <Combobox
              options={fruitOptions}
              value={singleValue}
              onChange={(v) => setSingleValue(v)}
              size="sm"
              placeholder="Small"
            />
          </div>
        </Row>

        <Row label="status error">
          <div className="w-64">
            <Combobox
              options={fruitOptions}
              value={singleError}
              onChange={(v) => setSingleError(v)}
              status="error"
              placeholder="오류 상태"
            />
          </div>
        </Row>

        <Row label="status success (초기값 있음)">
          <div className="w-64">
            <Combobox
              options={fruitOptions}
              value={singleSuccess}
              onChange={(v) => setSingleSuccess(v)}
              status="success"
              clearable
            />
          </div>
        </Row>

        <Row label="disabled">
          <div className="w-64">
            <Combobox
              options={fruitOptions}
              value={singleDisabled}
              onChange={(v) => setSingleDisabled(v)}
              disabled
              placeholder="비활성화"
            />
          </div>
        </Row>

        <Row label="generic (number value)">
          <div className="w-64">
            <Combobox
              options={numericOptions}
              value={singleNumeric}
              onChange={(v) => setSingleNumeric(v)}
              placeholder="숫자 값 선택"
            />
          </div>
          <Text size="sm" className="text-gray-400 self-center">
            선택값: {singleNumeric ?? "null"}
          </Text>
        </Row>
      </SECTION>

      <Divider />

      {/* Multiple Combobox */}
      <SECTION title="Combobox — Multiple">
        <Row label="기본 (선택 없음)">
          <div className="w-80">
            <Combobox
              multiple
              options={fruitOptions}
              value={multiValue}
              onChange={(v) => setMultiValue(v)}
              placeholder="과일 선택 (복수)"
            />
          </div>
          <Text size="sm" className="text-gray-400 self-center">
            선택값: [{multiValue.join(", ")}]
          </Text>
        </Row>

        <Row label="초기값 3개">
          <div className="w-80">
            <Combobox
              multiple
              options={fruitOptions}
              value={multiWithValues}
              onChange={(v) => setMultiWithValues(v)}
            />
          </div>
        </Row>

        <Row label="maxCount=2 (초기값 4개 → +2 표시)">
          <div className="w-80">
            <Combobox
              multiple
              options={fruitOptions}
              value={multiMaxCount}
              onChange={(v) => setMultiMaxCount(v)}
              maxCount={2}
            />
          </div>
        </Row>

        <Row label="clearable (초기값 있음)">
          <div className="w-80">
            <Combobox
              multiple
              options={fruitOptions}
              value={multiClearable}
              onChange={(v) => setMultiClearable(v)}
              clearable
            />
          </div>
        </Row>

        <Row label="emptyText 커스텀">
          <div className="w-80">
            <Combobox
              multiple
              options={fruitOptions}
              value={multiValue}
              onChange={(v) => setMultiValue(v)}
              emptyText="해당 과일이 없습니다"
              placeholder="검색 후 선택"
            />
          </div>
        </Row>

        <Row label="disabled (초기값 있음)">
          <div className="w-80">
            <Combobox
              multiple
              options={fruitOptions}
              value={multiDisabled}
              onChange={(v) => setMultiDisabled(v)}
              disabled
            />
          </div>
        </Row>

        <Row label="size sm">
          <div className="w-72">
            <Combobox
              multiple
              options={fruitOptions}
              value={multiValue}
              onChange={(v) => setMultiValue(v)}
              size="sm"
              placeholder="Small multiple"
            />
          </div>
        </Row>

        <Row label="status error">
          <div className="w-80">
            <Combobox
              multiple
              options={fruitOptions}
              value={multiValue}
              onChange={(v) => setMultiValue(v)}
              status="error"
              placeholder="오류 상태"
            />
          </div>
        </Row>
      </SECTION>

      <Divider />

      <section className="mb-8">
        <Text size="sm" className="text-gray-400">
          <Link href="/test/ui-kit" variant="muted">
            ← Atoms UI Kit (/test/ui-kit)
          </Link>
          {" · "}
          <Link href="/test/date" variant="muted">
            Date Molecules (/test/date) →
          </Link>
        </Text>
      </section>
    </main>
  )
}
