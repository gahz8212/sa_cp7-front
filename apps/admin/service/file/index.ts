import type { ApiResponse } from "@cp7/core"
import { apiClient } from "@/common/api/apiClient"
import type { FileDownloadParams, FileUploadResponse } from "./types"

export const uploadFile = async (file: File): Promise<FileUploadResponse> => {
  const formData = new FormData()
  formData.append("file", file)

  // const res = await apiClient.post<ApiResponse<FileUploadResponse>>("/files/upload", formData, {
  const res = await apiClient.post<ApiResponse<FileUploadResponse>>("/files/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return res.data.data
}

// API 스펙에 따라 방식 선택:
// [케이스 1] 인증 헤더 없이 URL 직접 접근 가능한 경우 → a.href에 URL 직접 할당, blob 불필요
// [케이스 2] 인증 헤더 필요 → axios로 blob 수신 후 createObjectURL 사용
export const downloadFile = async ({ fileId, fileName }: FileDownloadParams): Promise<void> => {
  const res = await apiClient.get(`/files/${fileId}/download`, {
    responseType: "blob",
  })

  const url = URL.createObjectURL(res.data as Blob)
  const a = document.createElement("a")
  a.href = url
  a.download = fileName
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 100)
}
