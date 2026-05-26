"use client"

import { useReactToPrint } from "react-to-print"
import type { UsePrintOptions, UsePrintReturn } from "./types"

export function usePrint({
  contentRef,
  documentTitle,
  pageStyle,
}: UsePrintOptions): UsePrintReturn {
  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle,
    pageStyle,
  })

  return { handlePrint: () => handlePrint() }
}
