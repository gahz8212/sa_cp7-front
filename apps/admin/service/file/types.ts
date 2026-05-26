// ─── Upload ─────────────────────────────────────────────────────────────────

export type FileUploadResponse = {
  fileId: string
  url: string
  fileName: string
  fileSize: number
}

// ─── Download ────────────────────────────────────────────────────────────────

export type FileDownloadParams = {
  fileId: string
  fileName: string
}
