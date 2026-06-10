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
  const [mappingResult, setMappingResult] = useState<any>(null)
  const [selectedHeaderCells, setSelectedHeaderCells] = useState<string[]>([])

  const rowToValues = (row: any) =>
    (Object.values(row).find((v) => Array.isArray(v)) as any[]) || Object.values(row)

  // 선택된 헤더 값들을 좌표 상태로부터 유도 (중복 제거)
  const selectedHeaders = useMemo(() => {
    const values = selectedHeaderCells.map((id) => {
      const [r, c] = id.split("-").map(Number)
      const row = allData[r]
      if (!row) return ""
      return String(rowToValues(row)[c] || "")
    })
    return Array.from(new Set(values.filter((v) => v !== "")))
  }, [selectedHeaderCells, allData])

  // Selection States
  type SelectionMode = "HEADER" | "DATA" | "ETC" | null
  const [mode, setMode] = useState<SelectionMode>(null)
  const [selectedHeaderRows, setSelectedHeaderRows] = useState<number[]>([])
  const [selectedSampleRows, setSelectedSampleRows] = useState<number[]>([])
  const [selectedEtcRows, setSelectedEtcRows] = useState<number[]>([])
  const headerBaseRowRef = useRef<number>(0)
  const sampleBaseRowRef = useRef<number>(0)
  const etcBaseRowRef = useRef<number>(0)
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
    setSelectedHeaderCells([])
    setMode(null)
    setMappingResult(null)
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
        const rawRows = response.data.dataList || response.data.data?.dataList || []
        // 숫자 뒤에 .0이 붙는 경우(예: 2.0) 이를 제거하여 정수 형태로 정규화
        const sanitize = (val: any): any => {
          if (typeof val === "string" && /^\d+\.0$/.test(val)) {
            return val.replace(/\.0$/, "")
          }
          return val
        }

        const newRows = rawRows.map((row: any) => {
          const sanitizedRow = { ...row }
          Object.keys(sanitizedRow).forEach((key) => {
            if (Array.isArray(sanitizedRow[key])) {
              sanitizedRow[key] = sanitizedRow[key].map(sanitize)
            } else {
              sanitizedRow[key] = sanitize(sanitizedRow[key])
            }
          })
          return sanitizedRow
        })

        setAllData((prev) => [...prev, ...newRows])
        setAllOriginalData((prev) => [...prev, ...JSON.parse(JSON.stringify(newRows))]) // Store deep copy
        setTotalCount(response.data.totalCount || response.data.data?.totalCount || 0)
        setLoadedChunks((prev) => new Set(prev.add(chunkIndex)))
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

    console.log("Modified Data:", changes)
    if (changes.length > 0) {
      axios.post("/api/common/save-excel-changes", { modifiedRows: changes })
    } else {
      alert("수정된 데이터가 없습니다.")
    }
  }

  const handleRowClick = (rowIndex: number) => {
    if (mode === "HEADER") {
      setSelectedHeaderRows((prev) => {
        const next = prev.includes(rowIndex)
          ? prev.filter((r) => r !== rowIndex)
          : [...prev, rowIndex].sort((a, b) => a - b)
        if (next.length > 0) headerBaseRowRef.current = next[0]

        return next
      })
      // 행을 선택 해제하거나 새로 선택할 때 해당 행의 개별 셀 선택 정보(흰색 배경)는 초기화
      setSelectedHeaderCells((prev) => prev.filter((id) => !id.startsWith(`${rowIndex}-`)))
    } else if (mode === "DATA") {
      setSelectedSampleRows((prev) => {
        const next = prev.includes(rowIndex)
          ? prev.filter((r) => r !== rowIndex)
          : [...prev, rowIndex].sort((a, b) => a - b)
        if (next.length > 0) sampleBaseRowRef.current = next[0]
        return next
      })
    } else if (mode === "ETC") {
      setSelectedEtcRows((prev) => {
        const next = prev.includes(rowIndex)
          ? prev.filter((r) => r !== rowIndex)
          : [...prev, rowIndex].sort((a, b) => a - b)
        if (next.length > 0) etcBaseRowRef.current = next[0]
        return next
      })
    }
  }

  const handleHeaderCellClick = (rowIndex: number, colIndex: number) => {
    if (mode !== "HEADER") return
    const cellId = `${rowIndex}-${colIndex}`

    setSelectedHeaderCells((prev) => {
      if (prev.includes(cellId)) {
        return prev.filter((id) => id !== cellId)
      } else {
        return [...prev, cellId]
      }
    })
  }

  const handleReset = () => {
    if (mode === "HEADER") {
      setSelectedHeaderRows([])
      setSelectedHeaderCells([])
    } else if (mode === "DATA") setSelectedSampleRows([])
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

    const buildStructure = (rows: any[], isHeader: boolean = false) => {
      if (rows.length === 0) return []
      const colCount = rows[0].length
      const result = []
      for (let col = 0; col < colCount; col++) {
        const colValues = rows.map((row, rowIndex) => {
          const val = row[col]
          return val === undefined || val === null ? "" : String(val).trim()
        })
        result.push(colValues)
      }
      return result
    }

    const headersMatrix = buildStructure(headerRows, true)
    const dataMatrix = buildStructure(sampleRows, false)
    const etcMatrix = buildStructure(etcRows, false)

    // 추가: 구조 변환 및 콘솔 출력
    const getStructuredData = (matrix: string[][], startRow: number) => {
      const colCount = matrix.length
      const rowCount = matrix[0]?.length || 0
      const results: any[] = []
      const visited = new Set<string>()

      for (let c = 0; c < colCount; c++) {
        for (let r = 0; r < rowCount; r++) {
          if (visited.has(`${c},${r}`)) continue
          const value = matrix[c][r]
          if (value !== "" && value !== null) {
            const cell: any = { value: value.trim(), row: r + startRow, col: c }
            let rowSpan = 1
            for (let j = r + 1; j < rowCount; j++) {
              if (matrix[c][j] === "") {
                rowSpan++
                visited.add(`${c},${j}`)
              } else break
            }
            if (rowSpan > 1) cell.rowspan = rowSpan
            let colSpan = 1
            for (let i = c + 1; i < colCount; i++) {
              if (matrix[i][r] === "") {
                colSpan++
                visited.add(`${i},${r}`)
              } else break
            }
            if (colSpan > 1) cell.colspan = colSpan
            results.push(cell)
          }
        }
      }
      return results
    }

    const getStructuredType = (matrix: string[][], startRow: number) => {
      const colCount = matrix.length
      const rowCount = matrix[0]?.length || 0
      const cellMap = new Map<string, any>()

      const getDataTypeAndPattern = (val: string) => {
        let type = "string"
        let pattern = undefined
        if (/^\d+(\.\d+)?$/.test(val)) {
          type = "number"
        } else if (/^\d{3}-\d{3,4}-\d{4}$/.test(val)) {
          type = "phone"
          pattern = "^\\d{3}-\\d{3,4}-\\d{4}$"
        } else if (/^\d{3}-\d{2}-\d{5}$/.test(val)) {
          type = "biz-number"
          pattern = "^\\d{3}-\\d{2}-\\d{5}$"
        }
        // else if (/[!@#$%^&*(),.?":{}|<>]/.test(val)) {
        //   type = 'text';
        //   pattern = '.*[!@#$%^&*(),.?":{}|<>].*';
        // }
        return { type, pattern }
      }

      for (let c = 0; c < colCount; c++) {
        for (let r = 0; r < rowCount; r++) {
          const val = matrix[c][r]
          if (cellMap.has(`${c},${r}`)) continue
          if (val !== "") {
            const { type, pattern } = getDataTypeAndPattern(val)
            const cell: any = { type, row: r + startRow, col: c }
            if (pattern) cell.pattern = pattern
            let rowSpan = 1
            for (let j = r + 1; j < rowCount; j++) {
              if (matrix[c][j] === "") {
                rowSpan++
                cellMap.set(`${c},${j}`, { type: "", row: j + startRow, col: c })
              } else break
            }
            if (rowSpan > 1) cell.rowspan = rowSpan
            let colSpan = 1
            for (let i = c + 1; i < colCount; i++) {
              if (matrix[i][r] === "") {
                colSpan++
                cellMap.set(`${i},${r}`, { type: "", row: r + startRow, col: i })
              } else break
            }
            if (colSpan > 1) cell.colspan = colSpan
            cellMap.set(`${c},${r}`, cell)
          }
        }
      }
      return Array.from(cellMap.values()).filter((cell) => cell.type !== "")
    }

    function mergeHeaderAndType(headers: any[], types: any[]) {
      const diff = headers.length - types.length

      return headers.map((header, index) => {
        // 1. 1:1 매핑된 타입 정보 가져오기
        let typeInfo
        if (diff > 0 && index >= types.length) {
          typeInfo = types[index - diff]
        } else {
          typeInfo = types[index]
        }

        // 2. value -> column 키 변경 및 객체 생성 (데이터 행의 실제 row 값 사용)
        const { value, ...rest } = header
        const merged: any = { 
          column: value, 
          ...rest, 
          row: typeInfo?.row ?? sampleBaseRowRef.current 
        }

        // 3. 타입 정보 병합
        if (typeInfo) {
          merged.type = typeInfo.type
          if (typeInfo.pattern) merged.pattern = typeInfo.pattern
          if (typeInfo.rowspan) merged.rowspan = typeInfo.rowspan
          if (typeInfo.colspan) merged.colspan = typeInfo.colspan
        } else {
          merged.type = "string"
        }

        return merged
      })
    }
    // 필터링 전 (오리진) 헤더 행 데이터 -- 전체 헤더 포함
    const structuredHeaders = getStructuredData(headersMatrix, headerBaseRowRef.current)
    // 필터링 후 헤더 행 데이터 -- 미사용 헤더 제거
    const filteredStructuredHeaders = structuredHeaders.filter(
      (h) => !selectedHeaders.includes(h.value),
    )
    const structuredData = getStructuredData(dataMatrix, sampleBaseRowRef.current)
    //변형된 구조 타입 데이터 (헤더 기반 필터링 적용)
    const transformStructuredData = mergeHeaderAndType(
        [...filteredStructuredHeaders].sort((a, b) => a.row - b.row || a.col - b.col),
        getStructuredType(dataMatrix, sampleBaseRowRef.current).sort(
          (a, b) => a.row - b.row || a.col - b.col,
        ),
      )
    console.log("헤더 행 데이터 :", structuredHeaders)
    console.log("데이터 행 데이터:", structuredData)
    console.log(
      "변환된 구조 타입 데이터 (필터링됨):",
      transformStructuredData
    )

    const recordHeight = sampleRows.length

    setMappingResult({
      headersMatrix,
      dataMatrix,
      etcMatrix,
      recordHeight,
      flattenedHeaders: structuredHeaders,
      flattenedData: transformStructuredData,
      flattenedEtc: getStructuredData(etcMatrix, etcBaseRowRef.current),
    })

    console.log("filename", fileInfo?.name)

    axios.post("/api/common/analyze-excel-structure", {
      fileName: fileInfo?.name,
      flattenedHeaders: structuredHeaders, // Array(6)
      flattenedData: transformStructuredData,    // Array(6)
      flattenedEtc: getStructuredData(etcMatrix, etcBaseRowRef.current),        // Array(0)
    })
    setMode(null)
  }

  const rowToValuesLegacy = (row: any) =>
    (Object.values(row).find((v) => Array.isArray(v)) as any[]) || Object.values(row)

  const handleCellEdit = (rowIndex: number, colIndex: number, newValue: string) => {
    const list = [...allData]
    const row = { ...list[rowIndex] }

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

  // 타입 검증 헬퍼
  const isValidType = (value: string, type: string) => {
    if (value === "") return true
    if (type === "string") return !/^\d+(\.\d+)?$/.test(value) // 숫자로만 구성된 문자열은 string 타입에서 에러 처리
    if (type === "number") return /^\d+(\.\d+)?$/.test(value)
    if (type === "phone") return /^\d{3}-\d{3,4}-\d{4}$/.test(value)
    if (type === "biz-number") return /^\d{3}-\d{2}-\d{5}$/.test(value)
    return true
  }

  // 데이터 행 검증 및 매핑 함수
  const validateAndMapRow = (rawDataRow: string[], schema: any[], rowIndex: number = 2) => {
    const mappedData: any = {}
    const errors: string[] = []

    schema.forEach((field) => {
      // 실제 좌표 계산: field.row는 상대적 위치, rowIndex는 데이터 순서
      const actualExcelRow = field.row + rowIndex + 1
      const cellValue = rawDataRow[field.col]

      // 타입 검증
      if (!isValidType(String(cellValue), field.type)) {
        errors.push(
          `${actualExcelRow}행 ${field.col + 1}열 ('${field.column}'): 타입 오류 (기대: ${field.type})`,
        )
      }

      // 데이터 매핑
      mappedData[field.column] = cellValue
    })

    return { mappedData, errors }
  }

  const isValidCell = (value: string, field: any) => {
    if (!field || !field.type) return true
    return isValidType(value, field.type)
  }

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
          <Button
            variant={mode === "HEADER" ? "primary" : "secondary"}
            onClick={() => setMode("HEADER")}
          >
            헤더 선택
          </Button>
          <Button
            variant={mode === "DATA" ? "primary" : "secondary"}
            onClick={() => setMode("DATA")}
          >
            데이터 선택
          </Button>
          <Button variant={mode === "ETC" ? "primary" : "secondary"} onClick={() => setMode("ETC")}>
            기타 선택
          </Button>
          <Button variant="secondary" onClick={handleReset}>
            선택 해제
          </Button>
          <div className="mx-2 border-l h-6" />
          <Button variant="primary" onClick={handleConfirmMapping}>
            구조 해석
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={handleExtractModifiedData}
          >
            수정 완료
          </Button>
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
                    className={`cursor-pointer ${isHeader ? "bg-yellow-200" : isData ? "bg-green-200" : isEtc ? "bg-blue-200" : "hover:bg-gray-50"}`}
                  >
                    <td
                      onClick={() => handleRowClick(rowIndex)}
                      className="border-2 p-2 text-xs text-gray-400 bg-gray-50 w-12 text-center border-gray-800 whitespace-nowrap"
                    >
                      {rowIndex + 1}
                    </td>
                    {rowValues.map((cell, colIndex) => {
                      const recordHeight = mappingResult?.recordHeight || 1
                      const relativeRow = (rowIndex - sampleBaseRowRef.current) % recordHeight
                      const targetSchemaRow = relativeRow + sampleBaseRowRef.current

                      const fieldSchema = mappingResult?.flattenedData?.find(
                        (f: any) => f.col === colIndex && f.row === targetSchemaRow,
                      )
                      // 스키마에 정의된 정확한 좌표(row, col) 패턴을 찾아 타입을 비교
                      const isInvalid = rowIndex >= sampleBaseRowRef.current && 
                                       fieldSchema && 
                                       !isValidType(String(cell), fieldSchema.type)

                      // 선택된 헤더 셀 여부 확인
                      // 행이 전체 선택(yellow)된 상태에서, selectedHeaderCells는 '흰색으로 변환할 셀'들의 목록임.
                      const isCellWhite = selectedHeaderCells.includes(`${rowIndex}-${colIndex}`);
                      const isHeaderRowSelected = selectedHeaderRows.includes(rowIndex);

                      return (
                        <td
                          key={colIndex}
                          onClick={() => {
                             if (mode === "HEADER" && isHeaderRowSelected) {
                               handleHeaderCellClick(rowIndex, colIndex);
                             }
                          }}
                          className={`border-2 text-sm text-center border-gray-800 whitespace-nowrap w-12 
                            ${isInvalid ? 'border-red-500 bg-red-100' : ''} 
                            ${isCellWhite ? 'bg-white' : (isHeaderRowSelected ? 'bg-yellow-200' : '')}
                            ${mode === "HEADER" && isHeaderRowSelected ? 'cursor-pointer' : ''}
                          `}>
                          <Input
                            autoWidth
                            className="w-full bg-transparent text-center outline-none"
                            value={String(cell || '')}
                            onChange={(e) => handleCellEdit(rowIndex, colIndex, e.target.value)}
                          />
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-center items-center gap-4 p-4 bg-gray-50 rounded border">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            이전
          </Button>
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
        <Text weight="bold" className="mb-2 block text-blue-800">
          {title}
        </Text>
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
                    if (value !== "") {
                      for (let j = r + 1; j < rowCount; j++) {
                        if (matrix[c][j] === "") {
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
                          "border border-blue-100 p-2 text-center align-middle min-w-[80px]",
                          value === "" ? "bg-gray-50" : "bg-white font-medium",
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
          <Button onClick={handleUpload} disabled={!file}>
            전송
          </Button>
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
              <Heading level={3} className="text-blue-900">
                구조 해석 결과
              </Heading>
              <Button variant="outline" size="sm" onClick={() => setMappingResult(null)}>
                결과 닫기
              </Button>
            </div>
            <div className="space-y-8">
              {renderMappingTable(mappingResult.headersMatrix, "📋 헤더 영역 (Headers)")}
              {renderMappingTable(mappingResult.dataMatrix, "📊 데이터 영역 (Data Samples)")}
              {mappingResult.etcMatrix.length > 0 &&
                renderMappingTable(mappingResult.etcMatrix, "📎 기타 정보 (Etc Info)")}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
