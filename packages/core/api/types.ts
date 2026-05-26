export type ApiResponse<T = null> = {
  status: number
  code: string
  message: string
  data: T
}

export type ApiClientConfig = {
  baseURL: string
  timeout?: number
  getAccessToken: () => string | null
  refreshURL: string
  onTokenRefreshed: (data: unknown) => void
  onAuthError: () => void
}

export type ApiClient = {
  client: import("axios").AxiosInstance
  refreshToken: () => Promise<void>
}
