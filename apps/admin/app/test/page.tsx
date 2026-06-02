import { Heading, Text, Link, Divider } from "@cp7/ui"

type TestPage = {
  href: string
  title: string
  category: string
  description: string
  items: string[]
}

const TEST_PAGES: TestPage[] = [
  {
    href: "/test/ui-kit",
    title: "Atoms",
    category: "UI Kit",
    description: "기본 UI 원자 컴포넌트 전체 목록",
    items: ["Button", "Input", "Textarea", "Select", "Checkbox", "Radio", "Link", "Text", "Heading", "Label", "Image", "Icon", "Badge", "Chip", "Divider", "Spinner"],
  },
  {
    href: "/test/select",
    title: "Molecules / Select",
    category: "UI Kit",
    description: "검색 및 다중 선택을 지원하는 Combobox 컴포넌트",
    items: ["Combobox (single)", "Combobox (multiple)", "clearable / disabled / status / size"],
  },
  {
    href: "/test/date",
    title: "Molecules / Date",
    category: "UI Kit",
    description: "날짜 선택 관련 컴포넌트 모음",
    items: ["YearPicker", "YearMonthPicker", "DatePicker", "DateRangePicker", "DateRangeField"],
  },
  {
    href: "/test/editor",
    title: "Organisms / RichEditor",
    category: "UI Kit",
    description: "HTML 리치 텍스트 에디터",
    items: ["기본 편집", "글자 수 제한 (maxLength)", "최대 높이 + 내부 스크롤", "disabled 모드"],
  },
  {
    href: "/test/timer",
    title: "Session Timer",
    category: "Core",
    description: "세션 만료 타이머 및 경고 팝업 동작 검증",
    items: ["SessionTimerProvider", "useSessionTimer", "경고 구간 진입", "자동 로그아웃"],
  },
  {
    href: "/test/print",
    title: "Print / PDF",
    category: "Core",
    description: "프린트 및 PDF 다운로드 훅 동작 검증",
    items: ["usePrint (인쇄 다이얼로그)", "usePdfDownload (html2canvas → PDF 저장)"],
  },
  {
    href: "/test/excel-upload",
    title: "Excel / Upload / 검증",
    category: "UI Kit",
    description: "엑셀파일 업로드 동작 검증",
    items: ["백엔드 실행 필요"],
  },
]

const CATEGORY_COLORS: Record<string, string> = {
  "UI Kit": "bg-blue-50 text-blue-700 border-blue-200",
  "Core": "bg-purple-50 text-purple-700 border-purple-200",
}

export default function TestIndexPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Heading level={1} className="mb-2">
        Test Pages
      </Heading>
      <Text size="sm" className="mb-8 text-gray-500">
        개발 중 컴포넌트 및 훅을 빠르게 확인할 수 있는 테스트 페이지 목록입니다.
      </Text>

      <Divider className="mb-8" />

      <div className="grid gap-4 sm:grid-cols-2">
        {TEST_PAGES.map((page) => (
          <Link key={page.href} href={page.href} variant="default" className="block rounded-xl border border-gray-200 p-5 no-underline transition-colors hover:border-gray-300 hover:bg-gray-50">
            <div className="mb-3 flex items-center gap-2">
              <span className={`rounded border px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[page.category] ?? ""}`}>
                {page.category}
              </span>
              <Heading level={4} className="text-gray-900">
                {page.title}
              </Heading>
            </div>
            <Text size="sm" className="mb-3 text-gray-600">
              {page.description}
            </Text>
            <ul className="flex flex-wrap gap-1">
              {page.items.map((item) => (
                <li key={item} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                  {item}
                </li>
              ))}
            </ul>
          </Link>
        ))}
      </div>
    </main>
  )
}
