"use client"

import { useMemo } from "react"
import { Button } from "@cp7/ui"
import { Input } from "@cp7/ui"
import { useExcelStore, rowToValues } from "../../../common/store/useExcelStore"

// 타입 검증 헬퍼
const isValidType = (value: string, type: string) => {
  if (value === "") return true
  if (type === "string") return !/^\d+(\.\d+)?$/.test(value) // 숫자로만 구성된 문자열은 string 타입에서 에러 처리
  if (type === "number") return /^\d+(\.\d+)?$/.test(value)
  if (type === "phone") return /^\d{3}-\d{3,4}-\d{4}$/.test(value)
  if (type === "biz-number") return /^\d{3}-\d{2}-\d{5}$/.test(value)
  return true
}

export function DataGrid() {
  const {
    allData,
    totalCount,
    page,
    mappingResult,
    selectedHeaderCells,
    mode,
    selectedHeaderRows,
    selectedSampleRows,
    selectedEtcRows,
    sampleBaseRow,
    setPage,
    setMode,
    resetSelection,
    fetchChunk,
    handleExtractModifiedData,
    handleRowClick,
    handleHeaderCellClick,
    handleConfirmMapping,
    handleCellEdit,
  } = useExcelStore()

  const pageSize = 20
  const paginatedData = useMemo(() => {
    return allData.slice((page - 1) * pageSize, page * pageSize)
  }, [allData, page])

  const totalPages = Math.ceil(totalCount / pageSize)

  const schemaLookup = useMemo(() => {
    const map = new Map<string, any>()
    mappingResult?.flattenedData?.forEach((field: any) => {
      map.set(`${field.row}-${field.col}`, field)
    })
    return map
  }, [mappingResult])

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
        <Button variant={mode === "DATA" ? "primary" : "secondary"} onClick={() => setMode("DATA")}>
          데이터 선택
        </Button>
        <Button variant={mode === "ETC" ? "primary" : "secondary"} onClick={() => setMode("ETC")}>
          기타 선택
        </Button>
        <Button variant="secondary" onClick={resetSelection}>
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
              const isHeader = selectedHeaderRows.has(rowIndex)
              const isData = selectedSampleRows.has(rowIndex)
              const isEtc = selectedEtcRows.has(rowIndex)
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
                    const relativeRow = (rowIndex - sampleBaseRow) % recordHeight
                    const targetSchemaRow = relativeRow + sampleBaseRow

                    const fieldSchema = schemaLookup.get(`${targetSchemaRow}-${colIndex}`)

                    const isInvalid =
                      rowIndex >= sampleBaseRow &&
                      fieldSchema &&
                      !isValidType(String(cell), fieldSchema.type)

                    const isCellWhite = selectedHeaderCells.has(`${rowIndex}-${colIndex}`)
                    const isHeaderRowSelected = selectedHeaderRows.has(rowIndex)

                    return (
                      <td
                        key={colIndex}
                        onClick={() => {
                          if (mode === "HEADER" && isHeaderRowSelected) {
                            handleHeaderCellClick(rowIndex, colIndex)
                          }
                        }}
                        className={`border-2 text-sm text-center border-gray-800 whitespace-nowrap w-12 
                          ${isInvalid ? "border-red-500 bg-red-100" : ""} 
                          ${isCellWhite ? "bg-white" : isHeaderRowSelected ? "bg-yellow-200" : ""}
                          ${mode === "HEADER" && isHeaderRowSelected ? "cursor-pointer" : ""}
                        `}
                      >
                        <Input
                          autoWidth
                          className="w-full bg-transparent text-center outline-none"
                          value={String(cell || "")}
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
