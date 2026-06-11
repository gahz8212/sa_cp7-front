"use client"

import { Heading } from "@cp7/ui"
import { UploadPanel } from "./UploadPanel"
import { DataGrid } from "./DataGrid"
import { MappingResult } from "./MappingResult"

export default function ExcelUploadTestPage() {
  return (
    <main className="flex h-screen p-6 gap-6">
      <UploadPanel />
      
      <div className="w-4/5 overflow-auto">
        <Heading level={2}>데이터 그리드</Heading>
        <DataGrid />
        <MappingResult />
      </div>
    </main>
  )
}
