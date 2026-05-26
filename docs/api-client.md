# API 클라이언트 설계

## 구조

```
packages/core/
  api/
    types.ts           ← ApiResponse<T>, ApiClientConfig 타입
    createApiClient.ts ← axios 팩토리 함수 (인터셉터 포함)

apps/{domain}/
  common/
    api/
      apiClient.ts     ← createApiClient에 도메인별 설정 주입
```

## 응답 스키마
```ts
type ApiResponse<T = null> = {
  status: number   // HTTP 상태코드
  code: string     // 비즈니스 코드 (예: "SYS_200", "AUTH_401")
  message: string
  data: T
}
```

## 토큰 전략
- **Access token**: 모듈 레벨 변수 (메모리, persist 없음, XSS 안전)
- **Refresh token**: BE가 httpOnly 쿠키로 관리 (JS 접근 불가)
- 로그인 성공 시 `setAccessToken(token)` 호출
- 페이지 새로고침 시 토큰 소멸 → /auth/refresh 호출로 복구 (cookie 자동 첨부)
- **탭 동기화**: BroadcastChannel('auth') — same-origin 격리 보장
  - `token_refreshed` → 다른 탭 access token 업데이트
  - `logout` → 다른 탭 로그아웃 처리

## 인터셉터 동작
- **Request**: Authorization Bearer 헤더 + Accept-Language 헤더 + 로딩 시작
- **Response 성공**: 로딩 종료
- **Response 401**: Queue 기반 토큰 리프레시 → 성공 시 원본 요청 재시도
- **Response 그 외 에러**: `usePopupStore.getState().showStorePopup()` 호출

## 토큰 리프레시 상세
- `isRefreshing` 플래그로 중복 갱신 방지
- 갱신 중 401은 `failedQueue`에 쌓았다가 갱신 완료 후 일괄 재시도
- 별도 axios 인스턴스로 refresh 호출 (인터셉터 순환 방지)
- refresh 자체 401 → `onAuthError()` 호출
- **`createApiClient` 반환값**: `{ client: AxiosInstance, refreshToken: () => Promise<void> }`
  - `refreshToken()`: 동일 `isRefreshing` 락 사용 → SessionTimerProvider에 주입하여 공유

## 도메인별 설정 파일 예시 (apps/{domain}/common/api/apiClient.ts)
```ts
let accessToken: string | null = null
const channel = typeof window !== "undefined" ? new BroadcastChannel("auth") : null

// broadcast=true: 다른 탭에도 전파
export const setAccessToken = (token: string, broadcast = true) => {
  accessToken = token
  if (broadcast && channel) channel.postMessage({ type: "token_refreshed", token })
}
export const clearAccessToken = (broadcast = true) => {
  accessToken = null
  if (broadcast && channel) channel.postMessage({ type: "logout" })
}

const handleAuthError = () => {
  clearAccessToken(false)  // 수신 측에서 호출, 재broadcast 방지
  useUserStore.getState().clearUserInfo()
  window.location.href = "/login"
}

export const logout = () => {
  clearAccessToken(true)   // 사용자 직접 로그아웃, 다른 탭에 broadcast
  useUserStore.getState().clearUserInfo()
  window.location.href = "/login"
}

export const { client: apiClient, refreshToken } = createApiClient({
  ...,
  onTokenRefreshed: (data) => { if (data.accessToken) setAccessToken(data.accessToken) },
  onAuthError: handleAuthError,
})

// 다른 탭 수신
if (channel) {
  channel.onmessage = (e) => {
    if (e.data.type === "token_refreshed") setAccessToken(e.data.token, false)
    if (e.data.type === "logout") handleAuthError()
  }
}
```

## 로그인 상태 판단
- UI 표시: `useUserStore.getState().userInfo !== null`
- 실제 인증 유효성: AuthProvider에서 앱 진입 시 refresh 또는 유저 정보 조회로 검증
- `userInfo`는 localStorage persist → 새로고침 후에도 유지되므로 신뢰 전 반드시 서버 검증 필요

## service 레이어 폴더 규칙

```
apps/{domain}/
  service/
    {domain}/
      index.ts    ← API 호출 함수
      types.ts    ← 요청/응답 타입
```

### import 패턴
```ts
import { getUser } from '@/service/user'
import type { GetUserResponse } from '@/service/user/types'
```

- `index.ts`에서 types re-export 하지 않음 (불필요)
- axios 헬퍼 함수(`apiGet`, `apiPost` 등) 없음 — `apiClient` 직접 사용
- `apiClient`는 `baseURL`이 인스턴스에 이미 설정되어 있으므로 상대 경로만 전달

## 패키지 의존성
- `packages/core/package.json`에 `axios`, `@types/node` 추가
- `packages/config/tsconfig/base.json`에 `"types": ["node"]` 추가 (전체 공통 적용)
