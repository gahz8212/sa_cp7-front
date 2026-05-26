import type React from "react"

export type UsePrintOptions = {
  contentRef: React.RefObject<HTMLElement | null>
  documentTitle?: string
  pageStyle?: string
}

export type UsePrintReturn = {
  handlePrint: () => void
}
