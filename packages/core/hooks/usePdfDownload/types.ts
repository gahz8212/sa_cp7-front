import type React from "react"

export type UsePdfDownloadOptions = {
  contentRef: React.RefObject<HTMLElement | null>
  fileName: string
  orientation?: "portrait" | "landscape"
  scale?: number
}

export type UsePdfDownloadReturn = {
  handleDownload: () => Promise<void>
  isLoading: boolean
}
