"use client"

import { useState } from "react"
import type { UsePdfDownloadOptions, UsePdfDownloadReturn } from "./types"

export function usePdfDownload({
  contentRef,
  fileName,
  orientation = "portrait",
  scale = 2,
}: UsePdfDownloadOptions): UsePdfDownloadReturn {
  const [isLoading, setIsLoading] = useState(false)

  const handleDownload = async (): Promise<void> => {
    if (!contentRef.current) return

    setIsLoading(true)
    try {
      const { toCanvas } = await import("html-to-image")
      const jsPDF = (await import("jspdf")).default

      const canvas = await toCanvas(contentRef.current, {
        pixelRatio: scale,
        cacheBust: true,
      })

      const imgWidth = orientation === "portrait" ? 210 : 297
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      const pdf = new jsPDF(orientation, "mm", "a4")
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, imgWidth, imgHeight)
      pdf.save(`${fileName}.pdf`)
    } catch (e) {
      console.error("[usePdfDownload]", e)
      throw e
    } finally {
      setIsLoading(false)
    }
  }

  return { handleDownload, isLoading }
}
