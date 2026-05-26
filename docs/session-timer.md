# SessionTimerProvider

## 위치
`packages/core/providers/SessionTimerProvider/`
- `types.ts`, `context.ts`, `index.tsx`

## 확정 스펙
| 항목 | 확정 |
|--|--|
| 토큰 | Access: 메모리, Refresh: httpOnly cookie |
| 탭 동기화 | BroadcastChannel('auth') — same-origin 격리 |
| 연장 방식 | 클릭 이벤트 자동 연장 (연장 버튼 없음) |
| 경고 팝업 | 만료 5분 전, 확인 → refreshToken + 리셋 / 취소 → 로그아웃 |
| 팝업 중 만료 | 만료 팝업으로 즉시 전환 |
| 새로고침 | full reset (사용자 동작으로 간주) |
| 타이머 시작 | setAccessToken() 호출 시 (= token 발급/갱신 시마다 리셋) |
| 로그아웃 | 서버 logout API 호출 (실패 무시) + 로그인 이동 |

## Props
```ts
type SessionTimerTexts = {
  warningTitle?: string
  warningMessage?: string
  warningConfirm?: string
  warningCancel?: string
  expiredTitle?: string
  expiredMessage?: string
  expiredConfirm?: string
}

type SessionTimerProviderProps = {
  children: ReactNode
  sessionTimeout: number        // ms (프론트 config, 서버 expiresIn 무관)
  warningBefore?: number        // ms, 기본 300000 (5분)
  onRefreshToken: () => Promise<void>  // createApiClient의 refreshToken 주입
  onLogout: () => void          // logout() 주입
  channelName?: string          // BroadcastChannel 이름, 기본 'auth'
  enabled?: boolean             // 로그인 상태에서만 true
  texts?: SessionTimerTexts     // 팝업 문구 (다국어 지원용), 미전달 시 한국어 기본값
}
```

## Context (노출값)
```ts
type SessionTimerContextValue = {
  remainingTime: number   // ms, 화면 타이머 표시용
}
```

## 핵심 구현 패턴
- **lastActivityRef**: Date.now() 기반으로 남은 시간 계산 → 초기화 시 setState 불필요
- **setInterval 콜백에서 팝업 트리거**: `useEffect` 본문 직접 setState 방지 (react-hooks/set-state-in-effect 규칙)
- **팝업 함수 ref 패턴**: `useCallback` + `useEffect`로 ref 갱신 → setInterval에서 최신 버전 참조
- **BroadcastChannel**: `token_refreshed` → resetTimer(), `logout` → onLogout()

## apps/admin 연결
- `AuthProvider` 내부에 배치 (PopupProvider 하위, usePopup 사용 가능)
- `enabled={!!userInfo}` — 로그인 상태에서만 타이머 동작
- `SESSION_TIMEOUT`: `.env`의 `NEXT_PUBLIC_SESSION_TIMEOUT` (ms), 기본 fallback 1시간
- `onRefreshToken={refreshToken}` — apiClient의 refreshToken (isRefreshing 락 공유)
- `onLogout={logout}` — broadcast 포함 로그아웃
- `texts`: `AuthProvider`에서 `t()`로 감싸서 주입 (다국어 처리)
  ```tsx
  texts={{
    warningTitle: t("세션 만료 예정"),
    warningMessage: t("세션이 곧 만료됩니다. 계속 사용하시겠습니까?"),
    warningConfirm: t("확인"), warningCancel: t("취소"),
    expiredTitle: t("세션 만료"),
    expiredMessage: t("세션이 만료되었습니다. 다시 로그인해주세요."),
    expiredConfirm: t("확인"),
  }}
  ```

## 주의사항
- `SessionTimerProvider`는 반드시 `PopupProvider` 하위에 배치 (usePopup 의존)
- 타이머 duration은 프론트 config 값 (서버 expiresIn과 독립)
- 다국어 문구는 Core 패키지에 직접 넣지 않고 앱에서 `texts` prop으로 주입 (Core 패키지 독립성 유지)
- 테스트 시 `.env`의 `NEXT_PUBLIC_SESSION_TIMEOUT`을 30000(30초) 등으로 줄여서 확인

## 확정된 동작 결정
- **클릭 후 타이머 표시**: 클릭 시 `lastActivityRef`만 갱신 (setState 없음) → 다음 tick(최대 1초 뒤)에 화면 반영
  - 클릭~다음 tick 사이 경과 시간만큼 이미 줄어든 값(예: 0:59) 표시 — **의도된 동작으로 확정**
  - 이유: 클릭마다 재렌더링 방지, 실제 서비스에서 사용자가 타이머를 주시하는 케이스 없음

## 1차 테스트 페이지
- 위치: `apps/admin/app/test/timer/page.tsx`
- sessionTimeout: 60초, warningBefore: 30초, channelName: "auth-test"
- 로그인/로그아웃 토글 버튼 + 남은 시간 표시
- 2차 검증: 로그인 구현 후 실제 인증 연동 통합 테스트 별도 진행
