import { createApiClient } from "@cp7/core"
import { useUserStore } from "../store/useUserStore"

type RefreshResponseData = {
  accessToken: string
}

let accessToken: string | null = null

const channel = typeof window !== "undefined" ? new BroadcastChannel("auth") : null

export const setAccessToken = (token: string, broadcast = true): void => {
  accessToken = token
  if (broadcast && channel) {
    channel.postMessage({ type: "token_refreshed", token })
  }
}

export const clearAccessToken = (broadcast = true): void => {
  accessToken = null
  if (broadcast && channel) {
    channel.postMessage({ type: "logout" })
  }
}

const handleAuthError = (): void => {
  clearAccessToken(false)
  useUserStore.getState().clearUserInfo()
  if (typeof window !== "undefined") {
    window.location.href = "/login"
  }
}

/** 사용자 직접 로그아웃 (다른 탭에도 브로드캐스트) */
export const logout = (): void => {
  clearAccessToken(true)
  useUserStore.getState().clearUserInfo()
  if (typeof window !== "undefined") {
    window.location.href = "/login"
  }
}

export const { client: apiClient, refreshToken } = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL!,
  timeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 180000,
  getAccessToken: () => accessToken,
  refreshURL: "/auth/refresh",
  onTokenRefreshed: (data) => {
    const token = (data as RefreshResponseData)?.accessToken
    if (token) setAccessToken(token)
  },
  onAuthError: handleAuthError,
})

// 다른 탭 동기화
if (channel) {
  channel.onmessage = (e: MessageEvent<{ type: string; token?: string }>) => {
    if (e.data.type === "token_refreshed" && e.data.token) {
      setAccessToken(e.data.token, false)
    }
    if (e.data.type === "logout") {
      handleAuthError()
    }
  }
}
