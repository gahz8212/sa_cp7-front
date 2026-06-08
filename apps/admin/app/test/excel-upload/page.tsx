"use client"

import { useState, useMemo, useRef } from "react"
import { Heading, Button, Text, cn } from "@cp7/ui"
import axios from "axios"
import { Input } from "@cp7/ui"

export default function ExcelUploadTestPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null)

  // All data chunked and loaded
  const [allData, setAllData] = useState<any[]>([])
  const [allOriginalData, setAllOriginalData] = useState<any[]>([]) // Add original state
  const [totalCount, setTotalCount] = useState(0)
  const [loadedChunks, setLoadedChunks] = useState<Set<number>>(new Set())

  const [page, setPage] = useState(1) // Current UI page
  const [modifiedData, setModifiedData] = useState<any>(null) // 수정된 내역 결과
  const [mappingResult, setMappingResult] = useState<any>(null)

  // Selection States
  type SelectionMode = "HEADER" | "DATA" | "ETC" | null
  const [mode, setMode] = useState<SelectionMode>(null)
  const [selectedHeaderRows, setSelectedHeaderRows] = useState<number[]>([])
  const [selectedSampleRows, setSelectedSampleRows] = useState<number[]>([])
  const [selectedEtcRows, setSelectedEtcRows] = useState<number[]>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setFileInfo({ name: selectedFile.name, size: selectedFile.size })
      setAllData([])
      setAllOriginalData([]) // Reset original
      setTotalCount(0)
      setLoadedChunks(new Set())
      setPage(1)
      setSelectedHeaderRows([])
      setSelectedSampleRows([])
      setSelectedEtcRows([])
      setMode(null)
      setMappingResult(null)
      setModifiedData(null)
    }
  }

  const fetchChunk = async (chunkIndex: number) => {
    if (loadedChunks.has(chunkIndex)) return
    if (!file) return

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("rowNo", "0")
      formData.append("sheetNo", "0")
      formData.append("page", (chunkIndex + 1).toString())
      formData.append("size", "1000")

      const response = await axios.post("/api/common/upload-excel", formData)

      if (response.data) {
        const newRows = response.data.dataList || response.data.data?.dataList || []
        setAllData(prev => [...prev, ...newRows])
        setAllOriginalData(prev => [...prev, ...JSON.parse(JSON.stringify(newRows))]) // Store deep copy
        setTotalCount(response.data.totalCount || response.data.data?.totalCount || 0)
        setLoadedChunks(prev => new Set(prev.add(chunkIndex)))
      }
    } catch (error: any) {
      console.error("Chunk fetch failed", error)
      alert(`업로드 실패: ${error.response?.data?.message || error.message}`)
    }
  }

  // Initial load
  const handleUpload = () => {
    setAllData([])
    setAllOriginalData([])
    setLoadedChunks(new Set())
    setPage(1)
    fetchChunk(0)
  }

  // 수정된 데이터만 추출하는 함수
  const handleExtractModifiedData = () => {
    if (allData.length === 0) return

    const changes = allData
      .map((currentRow: any, index: number) => {
        const originalRow = allOriginalData[index]
        if (!originalRow) return null

        const currentStr = JSON.stringify(currentRow)
        const originalStr = JSON.stringify(originalRow)

        if (currentStr !== originalStr) {
          return {
            rowIndex: currentRow.rowIndex ?? index,
            original: originalRow,
            modified: currentRow,
          }
        }
        return null
      })
      .filter((item: any) => item !== null)

    setModifiedData(changes)
    console.log("Modified Data:", changes)
    axios.post("/api/common/save-excel-changes", { modifiedRows: changes })
  }

  const handleRowClick = (rowIndex: number) => {
    if (mode === "HEADER") {
      setSelectedHeaderRows((prev) =>
        prev.includes(rowIndex)
          ? prev.filter((r) => r !== rowIndex)
          : [...prev, rowIndex].sort((a, b) => a - b),
      )
    } else if (mode === "DATA") {
      setSelectedSampleRows((prev) =>
        prev.includes(rowIndex)
          ? prev.filter((r) => r !== rowIndex)
          : [...prev, rowIndex].sort((a, b) => a - b),
      )
    } else if (mode === "ETC") {
      setSelectedEtcRows((prev) =>
        prev.includes(rowIndex)
          ? prev.filter((r) => r !== rowIndex)
          : [...prev, rowIndex].sort((a, b) => a - b),
      )
    }
  }

  const handleReset = () => {
    if (mode === "HEADER") setSelectedHeaderRows([])
    else if (mode === "DATA") setSelectedSampleRows([])
    else if (mode === "ETC") setSelectedEtcRows([])
  }

  const handleConfirmMapping = () => {
    const headerRows = selectedHeaderRows.map((idx) => rowToValues(allData[idx]))
    const sampleRows = selectedSampleRows.map((idx) => rowToValues(allData[idx]))
    const etcRows = selectedEtcRows.map((idx) => rowToValues(allData[idx]))

    if (headerRows.length === 0 || sampleRows.length === 0) {
      alert("헤더 행과 데이터 행을 모두 선택해 주세요.")
      return
    }

    const buildStructure = (rows: any[]) => {
      if (rows.length === 0) return []
      const colCount = rows[0].length
      const result = []
      for (let col = 0; col < colCount; col++) {
        const colValues = rows.map((row) => {
          const val = row[col]
          return val === undefined || val === null ? "" : String(val).trim()
        })
        result.push(colValues)
      }
      return result
    }

    setMappingResult({
      flattenedHeaders: buildStructure(headerRows),
      flattenedData: buildStructure(sampleRows),
      flattenedEtc: buildStructure(etcRows),
    })
    console.log("Mapping Result:", {
      flattenedHeaders: buildStructure(headerRows),
      flattenedData: buildStructure(sampleRows),
      flattenedEtc: buildStructure(etcRows),
    })
    axios.post("/api/common/analyze-excel-structure", {
      flattenedHeaders: buildStructure(headerRows), // Array(6)
      flattenedData: buildStructure(sampleRows),    // Array(6)
      flattenedEtc: buildStructure(etcRows),        // Array(0)
    })
    setMode(null)
  }

  const rowToValues = (row: any) =>
    (Object.values(row).find((v) => Array.isArray(v)) as any[]) || Object.values(row)

  const handleCellEdit = (rowIndex: number, colIndex: number, newValue: string) => {
    const list = [...allData]
    let row = { ...list[rowIndex] }

    const key = Object.keys(row).find((k) => Array.isArray(row[k]))
    if (key) {
      row[key] = [...row[key]]
      row[key][colIndex] = newValue
    } else {
      const keys = Object.keys(row)
      row[keys[colIndex]] = newValue
    }
    list[rowIndex] = row
    setAllData(list)
  }

  const pageSize = 20
  const paginatedData = useMemo(() => {
    return allData.slice((page - 1) * pageSize, page * pageSize)
  }, [allData, page])

  const totalPages = Math.ceil(totalCount / pageSize)

  const renderTable = () => {
    if (allData.length === 0) {
      return (
        <div className="mt-10 border-2 border-dashed p-10 text-center text-gray-400">
          파일을 업로드하면 여기에 데이터가 표시됩니다.
        </div>
      )
    }

    return (
      <div className="mt-6 flex flex-col">
        <div className="flex gap-2 p-2 border rounded mb-4 justify-end items-center">
          <Button variant={mode === "HEADER" ? "primary" : "secondary"} onClick={() => setMode("HEADER")}>헤더 선택</Button>
          <Button variant={mode === "DATA" ? "primary" : "secondary"} onClick={() => setMode("DATA")}>데이터 선택</Button>
          <Button variant={mode === "ETC" ? "primary" : "secondary"} onClick={() => setMode("ETC")}>기타 선택</Button>
          <Button variant="secondary" onClick={handleReset}>선택 해제</Button>
          <div className="mx-2 border-l h-6" />
          <Button variant="primary" onClick={handleConfirmMapping}>구조 해석</Button>
          <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleExtractModifiedData}>수정 완료</Button>
        </div>

        <div className="overflow-x-auto w-full border border-gray-200 ">
          <table className="mx-auto w-max min-w-max border-collapse border-2 border-gray-800 ">
            <tbody>
              {paginatedData.map((row: any, localIndex: number) => {
                const rowIndex = (page - 1) * pageSize + localIndex
                const isHeader = selectedHeaderRows.includes(rowIndex)
                const isData = selectedSampleRows.includes(rowIndex)
                const isEtc = selectedEtcRows.includes(rowIndex)
                const rowValues = rowToValues(row)

                return (
                  <tr
                    key={rowIndex}
                    onClick={() => handleRowClick(rowIndex)}
                    className={`cursor-pointer ${isHeader ? "bg-yellow-200" : isData ? "bg-green-200" : isEtc ? "bg-blue-200" : "hover:bg-gray-50"}`}
                  >
                    <td className="border-2 p-2 text-xs text-gray-400 bg-gray-50 w-12 text-center border-gray-800 whitespace-nowrap">
                      {rowIndex + 1}
                    </td>
                    {rowValues.map((cell, colIndex) => (
                      <td key={colIndex} className="border-2 text-sm text-center border-gray-800 whitespace-nowrap w-12">
                        <Input
                          autoWidth
                          className="w-full bg-transparent text-center outline-none"
                          value={String(cell || '')}
                          onChange={(e) => handleCellEdit(rowIndex, colIndex, e.target.value)}
                        />
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-center items-center gap-4 p-4 bg-gray-50 rounded border">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>이전</Button>
          <div className="flex items-center gap-2">
            <span className="font-bold text-blue-600">{page}</span>
            <span className="text-gray-400">/</span>
            <span>{totalPages || 1} 페이지</span>
          </div>
          <Button
            variant="secondary"
            disabled={page >= totalPages}
            onClick={() => {
              setPage(page + 1)
              // Prefetch logic: check if next page data needs a new chunk
              const nextPage = page + 1
              const nextChunk = Math.floor(((nextPage - 1) * pageSize) / 1000)
              fetchChunk(nextChunk)
            }}
          >
            다음
          </Button>
        </div>
      </div>
    )
  }

  const renderMappingTable = (matrix: string[][], title: string) => {
    if (!matrix || matrix.length === 0) return null
    const colCount = matrix.length
    const rowCount = matrix[0].length
    const visited = Array.from({ length: rowCount }, () => Array(colCount).fill(false))

    return (
      <div className="mt-6 first:mt-0">
        <Text weight="bold" className="mb-2 block text-blue-800">{title}</Text>
        <div className="overflow-x-auto border-2 border-blue-200 rounded-lg bg-white shadow-sm">
          <table className="w-full border-collapse text-sm">
            <tbody>
              {Array.from({ length: rowCount }).map((_, r) => (
                <tr key={r}>
                  {Array.from({ length: colCount }).map((_, c) => {
                    if (visited[r][c]) return null
                    const value = matrix[c][r]

                    // Calculate rowSpan
                    let rowSpan = 1
                    if (value !== '') {
                      for (let j = r + 1; j < rowCount; j++) {
                        if (matrix[c][j] === '') {
                          rowSpan++
                          visited[j][c] = true
                        } else {
                          break
                        }
                      }
                    }

                    return (
                      <td
                        key={c}
                        rowSpan={rowSpan}
                        className={cn(
                          'border border-blue-100 p-2 text-center align-middle min-w-[80px]',
                          value === '' ? 'bg-gray-50' : 'bg-white font-medium',
                        )}
                      >
                        {value}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <main className="flex h-screen p-6 gap-6">
      <div className="w-1/5 border-r pr-6 flex flex-col gap-4">
        <Heading level={2}>엑셀 파일 업로드</Heading>
        <input ref={fileInputRef} type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
        <div className="flex gap-2">
          <Button onClick={handleUpload} disabled={!file}>전송</Button>
          <Button
            variant="secondary"
            onClick={() => {
              setFile(null)
              setFileInfo(null)
              setAllData([])
              if (fileInputRef.current) {
                fileInputRef.current.value = ""
              }
            }}
          >
            취소
          </Button>
        </div>
        {fileInfo && (
          <div className="bg-gray-100 p-4 rounded">
            <Text>파일명: {fileInfo.name}</Text>
            <Text>용량: {(fileInfo.size / 1024).toFixed(2)} KB</Text>
          </div>
        )}
      </div>
      <div className="w-4/5 overflow-auto">
        <Heading level={2}>데이터 그리드</Heading>
        {renderTable()}
        {mappingResult && (
          <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex justify-between items-center mb-6 border-b border-blue-200 pb-4">
              <Heading level={3} className="text-blue-900">구조 해석 결과</Heading>
              <Button variant="outline" size="sm" onClick={() => setMappingResult(null)}>결과 닫기</Button>
            </div>
            <div className="space-y-8">
              {renderMappingTable(mappingResult.flattenedHeaders, '📋 헤더 영역 (Headers)')}
              {renderMappingTable(mappingResult.flattenedData, '📊 데이터 영역 (Data Samples)')}
              {mappingResult.flattenedEtc.length > 0 &&
                renderMappingTable(mappingResult.flattenedEtc, '📎 기타 정보 (Etc Info)')}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
