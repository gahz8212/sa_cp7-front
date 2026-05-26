# UI 컴포넌트 상세

## CSS 전략 확정
- **atoms**: CVA + Tailwind 유지 (업계 표준, shadcn/ui 패턴)
- **각 앱 globals.css** 필수 2줄:
  ```css
  @import "tailwindcss";
  @source "../../../packages/ui";  /* globals.css 기준 상대경로 */
  ```
- **globals.css는 반드시 layout.tsx에서 import** 필요 (누락 시 스타일 전혀 미적용)
- **@source 경로 관련 검토 결과**:
  - `@import "@cp7/ui/styles/base.css"` → `@tailwindcss/postcss`가 패키지 경로 resolve 못함 (미동작)
  - `../../../node_modules/@cp7/ui` → 심링크 참조 방식, 동일한 상대경로
  - `postcss-import` 추가 → Tailwind v4 내장 @import와 충돌 가능성으로 비권장
  - **결론**: 상대경로(`../../../packages/ui`)가 Tailwind v4 모노레포 표준이며 가장 안정적
- **새 앱 추가 시**: globals.css에 위 2줄 + layout.tsx에 globals.css import 필수
- **atoms 시각화 도구 미결정**: Storybook vs Ladle vs 커스텀 페이지 검토 중 → [상세 내용](./storybook-review.md)

## packages/ui/atoms 구현 완료
- 경로: `packages/ui/atoms/`, 유틸: `packages/ui/lib/utils.ts` → `cn()` (twMerge + clsx)

### Base UI 계열 (@base-ui/react) 7개
- Button, Input, Textarea, Select, Checkbox, Radio, Link

### 순수 Tailwind 계열 9개
- Text, Heading, Label, Image, Icon, Badge, Chip, Divider, Spinner

### 주요 패턴
- 폴더 구조: `atoms/ComponentName/index.tsx + types.ts`
- CVA(class-variance-authority)로 variant 관리
- `React.forwardRef` 사용 (Spinner 제외)
- `React.ComponentPropsWithoutRef<'tagName'>` 확장

### Base UI 실제 API (주의)
- Select: `Select.Item`, `Select.ItemText`, `Select.List` (Option/OptionText/Viewport 아님)
- Radio: `@base-ui/react/radio`에서 `Radio.Root`, `Radio.Indicator` (RadioGroup.Item 아님)
- Input/Textarea: Field.Input 없음 → 네이티브 요소 직접 사용 (Field.Root는 molecule에서)
- Select.onValueChange: `(value: string | null, eventDetails) => void` 형태

## packages/ui/molecules/alert 구현 완료 ✅
- 경로: `molecules/alert/Alert/index.tsx` + `types.ts`
- Portal(`createPortal` → `document.body`) 방식
- Props: `title?`, `message`, `variant?('Error'|'success'|'successBg')`, `className?`, `actions?(ReactNode)`, `onDimClick?(()=>void)`
- dim 클릭: 단일 버튼 = 확인(resolve true) / 이중 버튼 = 취소(resolve false)
- PopupProvider와 render prop(alertRenderer) 패턴으로 연결 (`@cp7/core` ↔ `@cp7/ui` 의존성 없이 분리)
- `apps/admin/app/client.tsx`에서 `alertRenderer={(props) => <Alert {...props} />}` 주입
- 디자인 미확정 → 퍼블리셔가 나중에 수정 예정

## packages/ui/molecules 구현 현황
- `DatePicker` — 단일 날짜, `editable` prop으로 masked input 지원 ✅
- `DateRangePicker` — range, 단일 Input (필터/검색용), `captionLayout` prop ✅
- `DateRangeField` — range, 두 Input (폼용), `captionLayout` prop ✅
- `YearPicker` — 년도 선택, decade 그리드, `clearable` prop ✅
- 폴더구조: `molecules/date/` 하위에 `_internal/formats.ts`, `_internal/styles.ts` 분리
- 기술 스택: react-day-picker v9 + date-fns v4 + imask/react-imask + @base-ui/react Popover
- `DateFormat`: `'dot'`(기본, yyyy.MM.dd) | `'dash'` | `'slash'`
- calendarClassNames: `group/day` + `group-data-[*]/day:` 패턴으로 td→button 스타일 전달
- **molecules는 atoms 최대 활용 원칙**: 트리거는 `inputVariants`, 내부 버튼은 `Button(ghost)`, 아이콘은 `Icon` atom 사용 (YearPicker부터 적용)
- **Atomic Design 확장 규칙 (필수)**: 무조건 atoms → molecules 순으로 확장. 새 컴포넌트 작업 시 atoms에 해당 컴포넌트가 있는지 먼저 확인 후 molecules 구성. atoms 없으면 atoms 먼저 생성.
- **Atoms 간 참조 금지**: atoms는 서로 참조하지 않음. atom 내부에서 아이콘이 필요하면 SVG 인라인, 버튼이 필요하면 `<button>` 네이티브 사용. molecules에서 atoms 참조는 허용.
- **Date 컴포넌트 상세**: [date-range-picker.md](./date-range-picker.md)

## atoms/Chip 스펙 ✅

| 항목 | 확정 내용 |
|------|---------|
| 컨텐츠 | `children: React.ReactNode` |
| X 버튼 표시 | `onRemove` 유무로 결정 |
| variant | `default / primary / success / warning / error / info` |
| size | `sm / md` |
| X 아이콘 | SVG 인라인 |
| X 버튼 | `<button>` 네이티브 |
| disabled | X 버튼 표시 유지 + 클릭 비활성화 |
| 버블링 | 내부 `e.stopPropagation()` 자동 처리 |
| onClick | 선택적, 유무로 `cursor-pointer` + hover 스타일 자동 전환 |
| className | 지원 |
| atoms 간 참조 | 없음 |

### Combobox molecule 구현 완료 ✅
- 경로: `molecules/select/Combobox/index.tsx` + `types.ts`
- 기술: `@base-ui/react/combobox` + `atoms/Chip` + `atoms/Icon` + `inputVariants`
- 단일/다중: `multiple` prop으로 제어
- 다중: `Combobox.InputGroup` (div) + 인라인 chips + `Combobox.Input`
- 단일: `Combobox.Trigger` (button) + popup 내부 `Combobox.Input`
- 필터링: `searchValue` state + `toLowerCase().includes()` 클라이언트 필터
- **Input 제어 방식**: `value={searchValue}` + `onInput`으로 양쪽 `BaseCombobox.Input` 직접 제어 (Root의 `inputValue`/`onInputValueChange` 사용 안 함 — 이중 제어 패턴 방지)
- **한국어 IME 버그 수정**: `onInputValueChange` → `onInput` 이벤트로 교체
  - `onInputValueChange`는 IME 조합 완료 후에만 트리거 → 한글 조합 중 필터 미작동
  - `onInput`은 조합 중에도 실시간 발생 → '체' 입력 시 '체리' 즉시 필터링
- **Enter 선택 기능**: 검색 결과 1개일 때 Enter로 선택. `handleInputKeyDown`에서 처리
  - **한국어 IME 이중 Enter 버그**: IME 조합 확정 Enter + 실제 Enter 2번 발생 → `e.nativeEvent.isComposing` 체크로 해결
  - `e.which === 229`는 deprecated이므로 사용 안 함
- **open 상태**: `useState`로 controlled (`onOpenChange`에서 닫힐 때 `setSearchValue("")` 처리)
- `maxCount` prop: 다중 선택 시 표시할 chip 최대 개수 (+N 오버플로)
- `clearable`, `status(default/error/success)`, `size(sm/md)`, `disabled`, `emptyText`, `className`, `popupClassName`
- **`value` 초기화**: `useMemo`로 감쌈 — `multiple=true`이고 `props.value`가 undefined일 때 `?? []`가 매 렌더마다 새 배열 생성하는 문제 방지
- **Base UI 동작 주의사항**:
  - `useRenderElement` props 병합 순서: `[inputProps, triggerProps, {Base UI onKeyDown}, validationProps(우리 핸들러)]` — Base UI가 return해도 우리 핸들러는 실행됨
  - Enter + `activeIndex===null`이면 Base UI가 팝업 닫음 (막을 방법 없음, 0건 닫힘 방지 로직 제거)
  - `ComboboxInput`은 `open && !isInsidePopup`일 때 앞에 hidden dismiss span 렌더링 (이벤트 영향 없음)

#### TypeScript 제네릭 해결 방법 (중요)
- 문제: `ComboboxProps<T>` union type에서 JSX 제네릭 추론 시 `multiple` discriminant 미작동
- 해결: `Combobox`를 overloaded function type으로 캐스팅
  ```ts
  type ComboboxComponent = {
    <T>(props: SingleComboboxProps<T> & { ref?: React.Ref<HTMLDivElement> }): React.ReactElement | null
    <T>(props: MultipleComboboxProps<T> & { ref?: React.Ref<HTMLDivElement> }): React.ReactElement | null
  }
  const Combobox = React.forwardRef(ComboboxInner) as unknown as ComboboxComponent
  ```
- 사용 시 패턴: `onChange={(v) => setValue(v)}` (setState 직접 전달 불가, 래핑 함수 사용)
- options에 명시적 타입 권장: `const opts: ComboboxOption<string>[] = [...]`

#### 테스트 페이지
- `apps/admin/app/test/select/page.tsx` (Single + Multiple 전 케이스)

- Badge와 Chip 관계: 완전 독립 (A안) — Badge는 상태 표시, Chip은 삭제 가능한 인터랙티브 태그

## packages/ui/organisms 구현 현황

### Atomic Design 카테고리 확장
- atoms → molecules → **organisms** 순서로 확장
- organisms: 외부 라이브러리 래핑 or 복잡한 독립 UI 섹션 (여러 molecules/atoms 조합)
- 폴더: `packages/ui/organisms/`, `packages/ui/index.ts`에 `export * from './organisms'` 추가

### RichEditor organism 구현 완료 ✅
- 경로: `organisms/RichEditor/index.tsx` + `types.ts` + `Toolbar/index.tsx`
- 기술: Tiptap (`@tiptap/react`) — MIT 라이선스, 공지사항/FAQ/회사정보 등 어드민 에디터 용도
- 라이선스: 코어 + 사용 extensions 모두 MIT 무료 (AI/협업/버전관리만 유료)

#### Props
```ts
type RichEditorProps = {
  value?: string                                   // HTML string
  onChange?: (html: string) => void                // 디바운스 300ms
  onImageUpload?: (file: File) => Promise<string>  // 파일 업로드 콜백
  maxLength?: number                               // 글자 수 제한 + 하단 카운터 표시
  minHeight?: number | string                      // 기본 200
  maxHeight?: number | string                      // 초과 시 내부 스크롤
  disabled?: boolean
  placeholder?: string
  className?: string
}

type RichEditorHandle = {
  getOrphanedImages: () => string[]  // 저장 시 서버에서 삭제할 이미지 URL 목록
}
```

#### 확정된 스펙
| 항목 | 확정 |
|------|------|
| 이미지 | 파일 업로드만, `onImageUpload` 콜백 주입 |
| 링크 | 툴바 팝업(window.prompt) + autolink 자동 감지 |
| 글자 수 | `maxLength` + 하단 카운터 실시간 표시 |
| 높이 | `minHeight`/`maxHeight` prop, 초과 시 내부 스크롤 |
| disabled | `disabled` prop |
| 붙여넣기 | Typography 확장으로 기본 서식만 유지 |
| 저장 포맷 | HTML |
| 툴바 | 상단 고정, 뷰어 불필요 (앱에서 dangerouslySetInnerHTML 직접 사용) |
| 이미지 삭제 추적 | `forwardRef` + `getOrphanedImages()` — 저장 시 lazy diff 방식 |

#### 이미지 삭제 추적 구현 (getOrphanedImages)
- **방식**: 저장 시점 lazy diff (실시간 추적 아님)
- **`trackedUrls: useRef<Set<string>>`**: 초기 value img src + 세션 중 업로드된 URL 보관
- **초기화**: 에디터 마운트 후 `editor.state.doc.descendants()`로 초기 img src 추출
- **업로드 추적**: Toolbar `onImageUploaded` 콜백으로 URL 추가
- **img src 추출**: HTML 파싱 아닌 `editor.state.doc.descendants()` 사용 (에디터 상태와 항상 동기화)
- **`getOrphanedImages()`**: `trackedUrls - 현재 에디터 img src` 반환
- **Undo/Redo**: 저장 시점에만 diff하므로 Undo/Redo 중 서버 삭제 없음 → URL 깨짐 없음
- **이탈/새로고침**: 호출부 책임, 서버 배치 정리 위임 (프론트에서 처리 불가)
- **초기화 버튼**: 미확정, 필요 시 `key` 패턴으로 호출부에서 처리

#### 호출부 사용 패턴
```tsx
const editorRef = useRef<RichEditorHandle>(null)

const handleSave = async () => {
  const orphans = editorRef.current?.getOrphanedImages() ?? []
  await Promise.all(orphans.map((url) => deleteImage(url)))
  await saveContent(html)
}

<RichEditor ref={editorRef} value={initialHtml} onImageUpload={uploadImage} ... />
```

#### 적용된 Tiptap Extensions
- StarterKit (Bold, Italic, Strike, Heading, BulletList, OrderedList, Blockquote, Code, HorizontalRule)
- Underline, Link(autolink), Image, Table(+Row/Cell/Header)
- TextAlign, Highlight, CharacterCount, Placeholder, Typography

#### 성능 최적화 (중요)
- **`onChange` 디바운스 300ms**: 키 입력마다 부모 리렌더 방지. `onChangeRef`로 최신 함수 참조 유지
- **`isInternalChange` ref**: 에디터 내부 변경 시 `useEffect`의 `setContent` 호출 건너뜀 (이중 동기화 방지)
- **`immediatelyRender: false`**: SSR hydration mismatch 방지 (필수)

#### Next.js 사용 시 주의사항
- `"use client"` 컴포넌트
- `immediatelyRender: false` 설정으로 SSR 처리 → `dynamic({ ssr: false })` 불필요, 직접 import 가능
- `onChange`에 setState 직접 전달 가능 (디바운스 내부 처리)

#### 테스트 페이지
- `apps/admin/app/test/editor/page.tsx`
