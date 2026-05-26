import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios"
import { useLoadingStore } from "../store/useLoadingStore"
import { useLocaleStore } from "../store/useLocaleStore"
import { usePopupStore } from "../store/usePopupStore"

type RetryableRequest = InternalAxiosRequestConfig & { _retry?: boolean }
import type { ApiClient, ApiClientConfig, ApiResponse } from "./types"

type QueueItem = {
  resolve: () => void
  reject: (error: unknown) => void
}

const DEFAULT_TIMEOUT = 180000

const ERROR_MESSAGES: Record<string, string> = {
  ECONNABORTED: "요청 시간이 초과되었습니다.",
  ERR_NETWORK: "네트워크 연결을 확인해주세요.",
  400: "잘못된 요청입니다.",
  403: "접근 권한이 없습니다.",
  404: "요청한 리소스를 찾을 수 없습니다.",
  500: "서버 오류가 발생했습니다.",
  502: "서버에 일시적인 문제가 발생했습니다.",
  503: "서비스를 일시적으로 사용할 수 없습니다.",
}

const getErrorMessage = (error: AxiosError<ApiResponse>): string => {
  const serverMessage = error.response?.data?.message
  if (serverMessage) return serverMessage

  const code = error.code ?? ""
  const status = error.response?.status?.toString() ?? ""

  return ERROR_MESSAGES[code] ?? ERROR_MESSAGES[status] ?? "오류가 발생했습니다. 다시 시도해주세요."
}

// 401은 리프레시 플로우에서 처리, 팝업 표시 안 함
const SILENT_STATUSES = new Set([401])

const handleApiError = (error: AxiosError<ApiResponse>): void => {
  if (typeof window === "undefined") return

  const status = error.response?.status
  if (status && SILENT_STATUSES.has(status)) return

  const message = getErrorMessage(error)
  usePopupStore.getState().showStorePopup("오류", message, "Error")
}

export function createApiClient(config: ApiClientConfig): ApiClient {
  const { baseURL, timeout = DEFAULT_TIMEOUT, getAccessToken, refreshURL, onTokenRefreshed, onAuthError } = config

  const instance = axios.create({
    baseURL,
    timeout,
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  })

  let isRefreshing = false
  let failedQueue: QueueItem[] = []

  const processQueue = (error: unknown = null): void => {
    failedQueue.forEach((item) => {
      if (error) item.reject(error)
      else item.resolve()
    })
    failedQueue = []
  }

  const doRefresh = async (): Promise<void> => {
    if (isRefreshing) {
      return new Promise<void>((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
    }

    isRefreshing = true
    try {
      const response = await axios.post<ApiResponse>(
        `${baseURL}${refreshURL}`,
        {},
        { withCredentials: true, headers: { "X-Skip-Loading": "true" } },
      )
      onTokenRefreshed(response.data.data)
      processQueue()
    } catch (error) {
      processQueue(error)
      onAuthError()
      throw error
    } finally {
      isRefreshing = false
    }
  }

  // ─── Request Interceptor ────────────────────────────────────────────────────

  instance.interceptors.request.use(
    (reqConfig: InternalAxiosRequestConfig) => {
      const token = getAccessToken()
      if (token) {
        reqConfig.headers["Authorization"] = `Bearer ${token}`
      }

      reqConfig.headers["Accept-Language"] = useLocaleStore.getState().userLocale

      if (!reqConfig.headers["X-Skip-Loading"]) {
        useLoadingStore.getState().startLoading()
        reqConfig.headers["X-Loading-Started"] = "true"
      }

      return reqConfig
    },
    (error: AxiosError) => {
      if (error.config?.headers?.["X-Loading-Started"]) {
        useLoadingStore.getState().stopLoading()
      }
      return Promise.reject(error)
    },
  )

  // ─── Response Interceptor ───────────────────────────────────────────────────

  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      if (response.config.headers["X-Loading-Started"]) {
        useLoadingStore.getState().stopLoading()
      }
      return response
    },
    async (error: AxiosError<ApiResponse>) => {
      const originalRequest = error.config as RetryableRequest | undefined

      if (originalRequest?.headers?.["X-Loading-Started"]) {
        useLoadingStore.getState().stopLoading()
        delete originalRequest.headers["X-Loading-Started"]
      }

      if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
        // refresh 엔드포인트 자체가 401 → 세션 만료, 로그아웃 처리
        if (originalRequest.url?.includes(refreshURL)) {
          onAuthError()
          return Promise.reject(error)
        }

        // 이미 리프레시 진행 중 → 대기열에 추가
        if (isRefreshing) {
          return new Promise<void>((resolve, reject) => {
            failedQueue.push({ resolve, reject })
          }).then(() => {
            originalRequest.headers["X-Skip-Loading"] = "true"
            return instance(originalRequest)
          })
        }

        originalRequest._retry = true

        try {
          await doRefresh()
          originalRequest.headers["X-Skip-Loading"] = "true"
          return instance(originalRequest)
        } catch (refreshError) {
          return Promise.reject(refreshError)
        }
      }

      handleApiError(error)
      return Promise.reject(error)
    },
  )

  return { client: instance, refreshToken: doRefresh }
}
