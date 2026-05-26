# 프린트 / PDF 기능 개발 컨텍스트

## 프로젝트 배경
- Vue → Next.js 마이그레이션 프로젝트
- 화면에 출력되는 영역의 프린트 및 PDF 다운로드 기능 신규 구현 필요

---

## 기존 Vue 구현 현황

| 컴포넌트 | 경로 | 방식 |
|---|---|---|
| 잔고증명서 | service/pages/cp-plus/payment-stat/balance-print-pop.vue | window.print() |
| e계좌확인증 | service/pages/cp-plus/mydesk/account-print-pop.vue | window.print() |
| 관리비 집행현황 | service/pages/cp-plus/payment-stat/excn-detail-pop.vue | 동적 스타일 주입 + window.print() |
| 직불확인서 | service/pages/cp-plus/approval/claim-direct-idnty-pop.vue | html2canvas + jsPDF → PDF 다운로드 |

---

## 확정된 Next.js 구현 방향

### 사용 라이브러리 (packages/core에 설치)
- **프린트**: `react-to-print`
- **PDF 다운로드**: `html-to-image` + `jspdf`

### 기능별 매핑

| 기능 | 방법 | 대상 컴포넌트 |
|---|---|---|
| 프린트 | `react-to-print` | 잔고증명서, e계좌확인증, 관리비 집행현황 |
| PDF 다운로드 | `html-to-image` + `jsPDF` | 직불확인서 |
| 대시보드 | 미제공 | - |

---

## 구현 원칙

1. **동적 스타일 주입 금지** — JS로 style을 직접 건드리지 않음
2. **컴포넌트 분리 없음** — 화면용/프린트용 컴포넌트를 따로 만들지 않음. 하나의 컴포넌트에서 처리
3. **`@media print` 최소화** — react-to-print가 ref 영역만 격리해서 프린트하므로 별도 미디어쿼리 거의 불필요
4. **SSR dynamic import 필수** — Next.js App Router는 `'use client'`도 서버 pre-render 함. html-to-image top-level import 시 빌드 에러 발생

---

## 공통 훅 구현 완료 ✅

### 위치
```
packages/core/hooks/
  usePrint/
    index.ts
    types.ts
  usePdfDownload/
    index.ts
    types.ts
  index.ts
```

### 설계 결정사항

| 항목 | 결정 | 이유 |
|---|---|---|
| 위치 | `packages/core/hooks/` | dashboard/cleanpay 등 여러 도메인에서 사용 예정 |
| 로딩 상태 | `isLoading` 반환, 호출부에서 제어 | 훅 단일 책임, 전역 스토어 결합도 방지 |
| 에러 처리 | throw + finally(isLoading 리셋) + console.error | 훅은 hook의 역할만, 에러 피드백은 호출부 책임 |
| PDF 옵션 | `fileName`, `orientation`, `scale` | pageSize/margin은 거의 A4 고정, CSS 레벨 제어가 자연스러움 |
| PDF 캡처 라이브러리 | `html-to-image` (`toCanvas`) | html2canvas는 oklch 미지원 → html-to-image로 교체 (2026-05-12) |

### usePdfDownload 내부 구현 포인트
- `toCanvas(el, { pixelRatio: scale, cacheBust: true })` → `HTMLCanvasElement` 반환
- jsPDF 연동: `canvas.toDataURL("image/png")` → `pdf.addImage(...)` → `pdf.save(...)`
- scale 옵션은 외부 API 이름 유지, 내부에서 `pixelRatio`로 매핑

### usePrint API
```ts
type UsePrintOptions = {
  contentRef: React.RefObject<HTMLElement | null>
  documentTitle?: string
  pageStyle?: string
}

type UsePrintReturn = {
  handlePrint: () => void
}
```

### usePdfDownload API
```ts
type UsePdfDownloadOptions = {
  contentRef: React.RefObject<HTMLElement | null>
  fileName: string
  orientation?: 'portrait' | 'landscape'  // 기본값: 'portrait'
  scale?: number                           // 기본값: 2
}

type UsePdfDownloadReturn = {
  handleDownload: () => Promise<void>
  isLoading: boolean
}
```

### 사용 예시

```tsx
// 프린트
import { usePrint } from '@cp7/core'

const printRef = useRef<HTMLDivElement>(null)
const { handlePrint } = usePrint({
  contentRef: printRef,
  documentTitle: '잔고증명서',
  pageStyle: '@page { size: A4; margin: 10mm; }',
})

// PDF 다운로드
import { usePdfDownload } from '@cp7/core'

const pdfRef = useRef<HTMLDivElement>(null)
const { handleDownload, isLoading } = usePdfDownload({
  contentRef: pdfRef,
  fileName: '직불확인서',
  orientation: 'portrait',
})

// 에러 처리 (try/catch 권장)
const handleClick = async () => {
  try {
    await handleDownload()
  } catch (e) {
    // 도메인에서 직접 처리 (팝업 등)
  }
}

// 로딩 연동 예시
<button disabled={isLoading} onClick={handleClick}>
  PDF 다운로드
</button>
```

---

## Tailwind v4 + oklch 색상 호환 문제 (해결됨 — html-to-image 교체로 종결)

### 원인 (이력)
- html2canvas v1.4.1은 `rgb`, `hsl`만 지원. `oklch`/`oklab`/`lab`/`lch` 파싱 불가
- Tailwind v4는 CSS 변수에 `oklch()` 사용 → `Attempting to parse an unsupported color function "lab"` 에러

### 해결 방법
`html-to-image`로 교체. SVG foreignObject 방식으로 브라우저가 직접 렌더링하므로 oklch 포함 모든 CSS를 네이티브 지원.
색상 변환 코드(100줄+) 완전 제거됨.

---

## 알려진 주의사항

- **외부 폰트**: pageStyle에 `@import url(...)` 추가 필요할 수 있음
- **페이지 넘김**: 테이블 행 중간 잘림 방지 → `tr { page-break-inside: avoid; }`
- **canvas 기반 차트**: react-to-print에서 빈 박스로 나올 수 있음 (단, 대시보드 프린트는 미제공이므로 해당 없음)
- **고정 픽셀 레이아웃**: A4 너비 초과 시 pageStyle에서 너비 조정 필요
- **try/catch 미사용 시**: isLoading은 finally로 보장되지만 사용자에게 에러 피드백 없음 — 호출부에서 try/catch 필수
