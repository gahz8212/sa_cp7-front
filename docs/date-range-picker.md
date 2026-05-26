# DateRange 컴포넌트 동작 방식 및 구현 현황

## 컴포넌트 구조
```
packages/ui/molecules/date/
├── _internal/
│   ├── formats.ts   (DateFormat type, FORMAT_MAP, MASK_MAP, PLACEHOLDER_MAP, formatDate, parseDate, DEFAULT_LOCALE)
│   └── styles.ts    (calendarClassNames for react-day-picker v9)
├── DatePicker/
├── DateRangePicker/
├── DateRangeField/
└── index.ts
```

## 각 컴포넌트 확정된 동작 방식

### DatePicker (단일 날짜)
- 트리거 클릭 → 달력 열림
- 날짜 클릭 → 선택 + 닫힘
- 외부 클릭 → 닫힘 (값 유지)
- editable 옵션: IMaskInput으로 직접 타이핑 지원

### DateRangePicker (단일 인풋, 필터용)
- 트리거 클릭 → 달력 열림 (기존 선택 하이라이트 표시, 첫 클릭 시 초기화)
- 1번째 날짜 클릭 → 시작일로 표시, 달력 유지
- 2번째 날짜 클릭 → 시작일~종료일 확정, 달력 닫힘
- 같은 날짜 두 번 클릭 → 당일 1일 범위 확정, 닫힘 (유효한 케이스)
- 외부 클릭 → 닫힘 (1번째만 선택된 상태면 { from: D1, to: undefined } 유지)
- numberOfMonths 기본값: 2 (dropdown 계열이면 1로 강제)

### DateRangeField (두 인풋, 폼용)
- numberOfMonths prop 없음 → 내부 1 고정
- 외부 클릭 → 닫힘 (값 유지)
- 인풋 재클릭 시 토글(닫힘) 없음 — 의도적 결정 (클릭 = 해당 날짜 편집 시작, 외부 클릭으로 닫기 지원)
- from 인풋 클릭 → value?.from 월 표시
- to 인풋 클릭 → value?.to ?? value?.from 월 표시 (calendarMonth 컨트롤드)

| # | 인풋 클릭 | 상태 | 날짜 선택 후 동작 | 달력 |
|---|-----------|------|-------------------|------|
| 1 | from | - | 달력 열림 (activeInput='from') | 열림 |
| 2 | to | - | 달력 열림 (activeInput='to') | 열림 |
| 3 | - | activeInput='from', to 없음 | from 저장, onChange 호출 | 유지 (activeInput→'to') |
| 4 | - | activeInput='from', to 있음, 선택일 ≤ to | from 저장, **to 보존**, onChange 호출 | 닫힘 |
| 5 | - | activeInput='from', to 있음, 선택일 > to | from 저장, **to 초기화**, onChange 호출 | 유지 (activeInput→'to') |
| 6 | - | activeInput='to', from 있음 | **from 보존**, to 저장, onChange 호출 | 닫힘 |
| 7 | - | activeInput='to', from 없음 | to 저장, onChange 호출 | 유지 (activeInput→'from') |

## 핵심 버그 및 원인 파악

### 문제: 날짜 하나 클릭해도 닫힘
- react-day-picker v9는 첫 번째 클릭에서 `{ from: D, to: D }` (같은 날짜)를 반환하는 케이스가 있음
- `range?.from && range?.to` 조건이 첫 클릭에서 바로 true → 닫힘

## 해결 방향 (확정)
**Option D: `selectedDay` 파라미터 + `draftRange` 단계 판별**

- react-day-picker `onSelect`의 두 번째 파라미터 `selectedDay` 직접 사용
- `range` (라이브러리 계산값) 무시 → 버그 원인 완전 우회
- `draftRange.from` 유무로 첫 번째/두 번째 클릭 판별 (추가 state/ref 없음)

```ts
onSelect(_range, selectedDay) {
  if (!draftRange?.from || draftRange?.to) {
    // 1번째 클릭
    setDraftRange({ from: selectedDay, to: undefined })
    onChange?.({ from: selectedDay, to: undefined })
  } else {
    // 2번째 클릭 (역순 클릭 자동 처리)
    const from = selectedDay < draftRange.from ? selectedDay : draftRange.from
    const to   = selectedDay < draftRange.from ? draftRange.from : selectedDay
    onChange?.({ from, to })
    setOpen(false)
  }
}
```

- `clickCountRef` 방식 사용 안 함 (사용자 거부)

## captionLayout 기능 — 전체 완료 ✅

### DatePicker
- `DatePickerCaptionLayout` 타입 (`"label" | "dropdown" | "dropdown-months" | "dropdown-years"`)
- `captionLayout` prop (기본값: `"label"`)
- `hasYearDropdown` 판별 → `endMonth` = 현재 +10년 자동 설정
- `fixedWeeks={true}` 적용 (높이 고정)
- `formatYearDropdown` 커스텀: `yyyy년` 포맷
- `styles.ts` 수정 (nav absolute, dropdown_root, dropdowns 등)

### DateRangePicker
- `captionLayout` prop 추가 (`DatePickerCaptionLayout`, `DatePicker/types.ts`에서 import)
- dropdown 계열 → `effectiveNumberOfMonths = 1` / label → `numberOfMonths` 유지 (기본 2)
- `startMonth`/`endMonth`: **dropdown 모드에서만** 전달 (label 모드는 미전달 → 화살표 자유 이동)
- `endMonth = maxDate ?? (hasYearDropdown ? +10년 : undefined)`
- 재오픈: label/dropdown 모두 `draftRange = value` (하이라이트 표시, 첫 클릭 시 초기화)
- `fixedWeeks={true}` 적용 (높이 고정)
- `formatters.formatYearDropdown`: `yyyy년` 포맷

### DateRangeField
- `captionLayout` prop 추가 (`DatePickerCaptionLayout`, `DatePicker/types.ts`에서 import)
- `numberOfMonths` prop 제거 → 내부 `1` 고정 (폼용 단일 달력 표준)
- `isDropdownMode = captionLayout !== "label"`
- `startMonth`/`endMonth`: **dropdown 모드에서만** 전달 (label 모드는 미전달)
- `endMonth = maxDate ?? (hasYearDropdown ? +10년 : undefined)`
- `calendarMonth` state (컨트롤드) + `onMonthChange`: from/to 전환 시 해당 월로 즉시 이동
  - from 클릭: `calendarMonth = value?.from`
  - to 클릭: `calendarMonth = value?.to ?? value?.from`
- `fixedWeeks={true}` 적용 (높이 고정)
- `formatters.formatYearDropdown`: `yyyy년` 포맷

## DateRangeField 기타 스펙

### 동적 min/max
| activeInput | 조건 | 적용 |
|-------------|------|------|
| `to` | from 있음 | minDate = max(props.minDate, value.from) |
| `from` | to 있음 | maxDate = min(props.maxDate, value.to) |

### 버튼 focus 스타일
- 팝업 닫힐 때 Base UI가 트리거 버튼으로 포커스 복귀 → `focus:outline-none focus:ring-0 focus:border-gray-300` override

## YearPicker 구현 완료 ✅

### 확정 스펙
- `value`: `number | undefined` (년도 숫자)
- `onChange`: `(year: number | undefined) => void`
- `locale`: date-fns Locale (기본: ko)
- `minDate` / `maxDate`: 년도 범위 제한
- `clearable`: X 버튼으로 값 초기화
- `placeholder`: 기본값 locale 기반 (ko→`년도 선택`, 그 외→`Select year`)

### 팝업 동작
- decade 기준: 0으로 끝나는 decade (2020~2029)
- 소프트 기본 범위: min 없으면 현재-100년, max 없으면 현재+10년
- 초기 표시 decade: value → value decade / value 없음 + 현재 년도 범위 내 → 현재 decade / 현재 년도 범위 밖 → minDate decade
- 범위 밖 년도 disabled, 이전/다음 버튼 비활성화
- 재오픈 시 기존 선택값 하이라이트, 선택 즉시 닫힘
- 인풋 표시: ko → `2026년` / 그 외 → `2026`

### atoms 활용
- 트리거: `inputVariants` (Input atom)
- 내비게이션/그리드/clearable 버튼: `Button` atom (`ghost` variant)
- 아이콘: `Icon` atom (CalendarIcon, XIcon, ChevronLeft/Right)

### _internal/formats.ts 추가 함수
- `formatYear(year, locale)`: locale 기반 년도 포맷
- `getDefaultYearPlaceholder(locale)`: locale 기반 기본 placeholder

## YearMonthPicker 구현 완료 ✅

### 확정 스펙
- `value`: `Date | undefined` (선택된 년월, day=1 고정)
- `onChange`: `(date: Date | undefined) => void`
- `format`: `"dot" | "dash" | "slash"` (기본: `"dot"`, 예: `2026.05`)
- `locale`: date-fns Locale (기본: ko)
- `minDate` / `maxDate`: 년월 범위 제한
- `clearable`: X 버튼으로 값 초기화
- `placeholder`: 기본값 locale 기반 (ko→`년월 선택`, 그 외→`Select month`)

### 팝업 동작 (C안)
- 기본 뷰: 월 그리드 (3열 4행, Jan~Dec)
- 헤더 년도 클릭 → 년도 그리드 뷰로 전환
- 년도 그리드에서 년도 선택 → 월 그리드로 복귀 (닫히지 않음)
- 월 선택 → 닫힘, onChange 호출 (`new Date(selectedYear, monthIndex, 1, 12, 0, 0)`)
  - 정오(12:00) 생성으로 타임존 이슈 방지 (UTC±12 모두 안전)
- 재오픈 시 기존 선택값 하이라이트

### 월 disabled 판별
- `new Date(selectedYear, monthIndex, 1)` 기준으로 min/max 비교
- 년도 그리드에서 다른 년도 선택 후 월 그리드로 돌아올 때도 동일 로직 적용

### 헤더 아이콘
- 년도 옆 화살표: ChevronDown (아래 방향 ▼) — 드롭다운 방향

### _internal 공유 컴포넌트
- `YearGrid.tsx`: YearPicker와 YearMonthPicker 공유 decade 그리드 UI
  - `getDecadeStart(year)`: `Math.floor(year / 10) * 10`
  - props: `decadeStart`, `selectedYear`, `effectiveMinYear`, `effectiveMaxYear`, `locale`, `onYearSelect`, `onDecadeChange`

### _internal/formats.ts 추가 함수
- `YEAR_MONTH_FORMAT_MAP`: `{ dot: 'yyyy.MM', dash: 'yyyy-MM', slash: 'yyyy/MM' }`
- `YEAR_MONTH_PLACEHOLDER_MAP`: `{ dot: 'yyyy.mm', dash: 'yyyy-mm', slash: 'yyyy/mm' }`
- `formatYearMonth(date, fmt)`: 날짜 → 포맷 문자열
- `getDefaultYearMonthPlaceholder(locale)`: locale 기반 기본 placeholder

### 컴포넌트 구조 (업데이트)
```
packages/ui/molecules/date/
├── _internal/
│   ├── formats.ts
│   ├── styles.ts
│   └── YearGrid.tsx   (NEW)
├── DatePicker/
├── DateRangePicker/
├── DateRangeField/
├── YearPicker/
└── YearMonthPicker/   (NEW)
```

## 라이브러리 버전
- react-day-picker: ^9.0.0
- date-fns: ^4.1.0
- @base-ui/react: Popover 사용 (controlled open state)
