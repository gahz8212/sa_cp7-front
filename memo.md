# RichEditor 저장 형식 메모

## 데이터 형식
- **형식**: HTML 문자열 (String)
- **예시**: `"<p>내용... <b>굵게</b></p>"`

## 주요 특징
1. **데이터베이스 저장**: DB의 `TEXT` 또는 `VARCHAR` 컬럼에 그대로 저장 가능합니다.
2. **렌더링**: 웹 표준 방식이므로 일반 웹 페이지에서 `<div dangerouslySetInnerHTML={{ __html: content }} />`와 같이 쉽게 출력이 가능합니다.
3. **편집 연속성**: 저장된 HTML을 에디터의 `value`로 다시 전달하면 작성 중이던 스타일과 구조가 그대로 복원됩니다.

## Next.js & Auth 학습 메모 (2026-05-27)

### 1. 하이드레이션(Hydration) 오류
- **원인**: 서버가 생성한 정적 HTML과 브라우저가 첫 렌더링에서 생성한 구조/데이터가 다를 때 발생.
- **예시**: `localStorage`, `window` 객체 접근, `new Date()` 등 서버와 클라이언트의 결과가 다른 코드 사용 시.
- **해결**: `useEffect`를 사용하여 마운트 이후에 실행하거나, `suppressHydrationWarning` 속성 사용.

### 2. AuthProvider & Popup 무한 루프 해결
- **이슈**: `useEffect`의 의존성 배열에 포함된 함수가 렌더링마다 새로 생성되어 무한 리렌더링 발생 (Maximum update depth exceeded).
- **해결**: `PopupProvider`의 context value를 `useMemo`로 감싸서 참조 무결성을 보장함.

### 3. 세션 타이머 (SessionTimer)
- **구조**: `SessionTimerProvider`는 남은 시간 계산 및 팝업 트리거 로직만 담당.
- **UI**: 실제로 시간을 표시하려면 `useSessionTimer` 훅을 사용하는 별도의 UI 컴포넌트(예: `TimerStatus`)가 필요함.
- **동기화**: `BroadcastChannel`을 통해 여러 탭 간의 세션 상태가 동기화됨.
