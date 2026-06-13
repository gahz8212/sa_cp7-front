"use client"
import { useMemo, useState } from "react"
import { Button, Input, Badge, Checkbox, Label } from "@cp7/ui"
import { useExcelStore, rowToValues } from "../../../common/store/useExcelStore"
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core"

// 타입 검증 헬퍼
const isValidType = (value: string, type: string) => {
  if (value === "") return true
  if (type === "string") return !/^\d+(\.\d+)?$/.test(value) // 숫자로만 구성된 문자열은 string 타입에서 에러 처리
  if (type === "number") return /^\d+(\.\d+)?$/.test(value)
  if (type === "phone") return /^\d{3}-\d{3,4}-\d{4}$/.test(value)
  if (type === "biz-number") return /^\d{3}-\d{2}-\d{5}$/.test(value)
  return true
}

function DraggableBadge({ col, disabled }: { col: any; disabled: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: col.backColumn,
    data: col,
    disabled,
  })

  // 드래그 중일 때는 원본 위치의 배지를 투명하게(또는 숨김) 처리
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`relative touch-none ${isDragging ? "opacity-0" : "opacity-100"}`}
    >
      <Badge
        variant={col.required ? "error" : "info"}
        className={`${!disabled ? "cursor-grab shadow-sm hover:shadow-md" : ""}`}
        title={col.description}
      >
        {col.name} {col.required && "*"}
      </Badge>
    </div>
  )
}

function DroppableCell({
  id,
  children,
  isSelected,
}: {
  id: string
  children: React.ReactNode
  isSelected: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    disabled: !isSelected,
  })

  return (
    <div
      ref={setNodeRef}
      className={`w-full h-full min-h-[32px] relative transition-colors ${isOver ? "bg-blue-100 ring-2 ring-blue-400 ring-inset" : ""}`}
    >
      {children}
    </div>
  )
}

export function DataGrid() {
  const [activeCol, setActiveCol] = useState<any | null>(null)
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
    targetColumns,
    isMappingConfirmed,
    setPage,
    setMode,
    resetSelection,
    fetchChunk,
    handleExtractModifiedData,
    handleRowClick,
    handleHeaderCellClick,
    handleConfirmMapping,
    handleCellEdit,
    updateColumnMapping,
    confirmMappingCompletion,
    setIsMappingConfirmed,
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

  const hasHeaderSelected = selectedHeaderRows.size > 0

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const draggedCol = targetColumns.find((c) => c.backColumn === active.id)
    if (draggedCol) {
      setActiveCol(draggedCol)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCol(null)
    const { active, over } = event
    if (over && over.id) {
      // over.id는 `${rowIndex}-${colIndex}` 형태
      const [r, c] = String(over.id).split("-").map(Number)
      const rowValues = rowToValues(allData[r])
      const excelHeaderName = String(rowValues[c] || "")

      updateColumnMapping(String(active.id), excelHeaderName, c)
    }
  }

  const onCompleteClick = () => {
    // 1. 구조 해석 자동 실행
    handleConfirmMapping()

    // 2. 매핑 완료 체크 및 진행
    const allMapped = targetColumns.every((col) => col.frontColumn)

    if (!allMapped) {
      const missing = targetColumns
        .filter((col) => !col.frontColumn)
        .map((col) => col.name)
        .join(", ")
      if (!confirm(`아직 매핑되지 않은 항목(${missing})이 있습니다. 그래도 진행하시겠습니까?`)) {
        return
      }
    }

    confirmMappingCompletion()
    handleExtractModifiedData()
  }

  // 매핑되지 않은 시스템 컬럼만 배지로 표시
  const unmappedColumns = useMemo(() => {
    return targetColumns.filter((c) => !c.frontColumn)
  }, [targetColumns])

  if (allData.length === 0) {
    return (
      <div className="mt-10 border-2 border-dashed p-10 text-center text-gray-400">
        파일을 업로드하면 여기에 데이터가 표시됩니다.
      </div>
    )
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="mt-6 flex flex-col">
        {/* 백엔드 시스템 컬럼 (D&D Source 영역) - 매핑 완료 시 스르륵 사라짐 */}
        <div
          className={`overflow-hidden transition-all duration-500 ease-in-out ${
            isMappingConfirmed ? "max-h-0 opacity-0 mb-0" : "max-h-[300px] opacity-100 mb-4"
          }`}
        >
          <div
            className={`p-4 border rounded-lg transition-colors ${hasHeaderSelected ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"}`}
          >
            <div className="flex justify-between items-center mb-2">
              <div
                className={`text-sm font-bold ${hasHeaderSelected ? "text-blue-800" : "text-gray-500"}`}
              >
                매핑할 시스템 컬럼
              </div>
              {!hasHeaderSelected && (
                <div className="text-xs text-red-500 font-medium">
                  * 아래 데이터 그리드에서 &apos;헤더&apos; 행을 먼저 선택해주세요.
                </div>
              )}
              {hasHeaderSelected && (
                <div className="text-xs text-blue-600 font-medium">
                  드래그하여 아래 선택된 노란색 헤더 셀에 놓으세요.
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 min-h-[28px]">
              {unmappedColumns.map((col) => (
                <div
                  key={col.backColumn}
                  className={`transition-all duration-200 ${!hasHeaderSelected ? "opacity-40 grayscale pointer-events-none" : ""}`}
                >
                  <DraggableBadge col={col} disabled={!hasHeaderSelected} />
                </div>
              ))}
              {unmappedColumns.length === 0 && targetColumns && targetColumns.length > 0 && (
                <div className="text-sm text-gray-500 italic">모든 컬럼이 매핑되었습니다.</div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 p-2 border rounded mb-4 justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-6 ml-2">
            <div className="flex items-center gap-2 cursor-pointer group">
              <Checkbox
                id="edit-mapping-mode"
                checked={!isMappingConfirmed}
                onCheckedChange={(checked) => setIsMappingConfirmed(!checked)}
              />
              <Label
                htmlFor="edit-mapping-mode"
                className="text-sm font-semibold text-gray-700 cursor-pointer group-hover:text-blue-600 transition-colors"
              >
                매핑 정보 수정 모드
              </Label>
            </div>

            <div className="flex gap-2">
              <Button
                variant={mode === "HEADER" ? "primary" : "secondary"}
                onClick={() => setMode("HEADER")}
                size="sm"
              >
                헤더 선택
              </Button>
              <Button
                variant={mode === "DATA" ? "primary" : "secondary"}
                onClick={() => setMode("DATA")}
                size="sm"
              >
                데이터 선택
              </Button>
              <Button
                variant={mode === "ETC" ? "primary" : "secondary"}
                onClick={() => setMode("ETC")}
                size="sm"
              >
                기타 선택
              </Button>
              <Button variant="secondary" onClick={resetSelection} size="sm">
                선택 해제
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="mx-2 border-l h-6" />
            <Button
              className="bg-red-600 hover:bg-red-700 text-white shadow-md transition-all active:scale-95"
              onClick={onCompleteClick}
            >
              수정 완료
            </Button>
          </div>
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
                      const cellId = `${rowIndex}-${colIndex}`

                      // 통합된 targetColumns에서 이 셀에 매핑된 정보가 있는지 확인
                      const mappedColumn = targetColumns.find(
                        (col) =>
                          isHeaderRowSelected &&
                          col.excelColIndex === colIndex &&
                          col.frontColumn?.trim() === String(rowValues[colIndex] || "").trim(),
                      )

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
                          <DroppableCell id={cellId} isSelected={isHeaderRowSelected}>
                            <div
                              className={`flex flex-col items-center justify-center p-1 relative transition-all duration-200 ${isHeaderRowSelected ? "min-h-[60px]" : "min-h-[50px]"}`}
                            >
                              {/* 기존 엑셀 컬럼명 (항상 정중앙 유지) */}
                              <div className="w-full h-full flex justify-center items-center z-0">
                                <Input
                                  autoWidth
                                  className={`bg-transparent text-center outline-none ${isHeaderRowSelected ? "font-bold mt-2" : ""}`}
                                  value={String(cell || "")}
                                  onChange={(e) =>
                                    handleCellEdit(rowIndex, colIndex, e.target.value)
                                  }
                                  readOnly={isHeaderRowSelected}
                                />
                              </div>
                              {/* 매핑된 뱃지 및 체크 아이콘 표시 영역 */}
                              {isHeaderRowSelected && mappedColumn && (
                                <>
                                  {!isMappingConfirmed ? (
                                    <div
                                      className="absolute top-0.5 left-1/2 -translate-x-1/2 z-10 cursor-pointer group"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        updateColumnMapping(mappedColumn.backColumn, null, null) // 매핑 해제
                                      }}
                                      title="클릭하여 매핑 해제"
                                    >
                                      <Badge
                                        variant={mappedColumn.required ? "error" : "info"}
                                        size="sm"
                                        className="shadow-md transition-all duration-200 group-hover:scale-95 group-hover:opacity-80 group-hover:bg-gray-400 group-hover:text-white"
                                      >
                                        <span className="group-hover:line-through">
                                          {mappedColumn.name}
                                        </span>
                                      </Badge>
                                    </div>
                                  ) : (
                                    <div
                                      className="absolute top-1 right-1 z-10 flex items-center justify-center w-5 h-5 bg-green-500 rounded-full shadow-sm animate-in zoom-in duration-300"
                                      title={`매핑 완료: ${mappedColumn.name}`}
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-3 w-3 text-white"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={3}
                                          d="M5 13l4 4L19 7"
                                        />
                                      </svg>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </DroppableCell>
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
      <DragOverlay>
        {activeCol ? (
          <Badge
            variant={activeCol.required ? "error" : "info"}
            className="cursor-grabbing shadow-lg scale-105"
          >
            {activeCol.name} {activeCol.required && "*"}
          </Badge>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
