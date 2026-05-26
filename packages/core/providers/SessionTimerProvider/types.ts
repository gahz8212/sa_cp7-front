import type { ReactNode } from "react"

export type SessionTimerTexts = {
  warningTitle?: string
  warningMessage?: string
  warningConfirm?: string
  warningCancel?: string
  expiredTitle?: string
  expiredMessage?: string
  expiredConfirm?: string
}

export type SessionTimerProviderProps = {
  children: ReactNode
  /** 세션 만료 시간 (ms). ex) 3600000 = 1시간 */
  sessionTimeout: number
  /** 만료 경고 팝업 표시 기준 (ms). 기본값: 300000 (5분) */
  warningBefore?: number
  /** 토큰 갱신 함수 (createApiClient의 refreshToken) */
  onRefreshToken: () => Promise<void>
  /** 로그아웃 처리 함수 */
  onLogout: () => void
  /** BroadcastChannel 채널명. 기본값: 'auth' */
  channelName?: string
  /** 타이머 활성화 여부 (로그인 상태에서만 true) */
  enabled?: boolean
  /** 팝업 문구 (다국어 지원용). 미전달 시 한국어 기본값 사용 */
  texts?: SessionTimerTexts
}

export type SessionTimerContextValue = {
  /** 남은 시간 (ms). 화면 타이머 표시용 */
  remainingTime: number
}
