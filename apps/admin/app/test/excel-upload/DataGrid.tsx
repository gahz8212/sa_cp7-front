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
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"

// 타입 검증 헬퍼
const isValidType = (value: string, type: string, regex?: string | null) => {
  const trimmedValue = value.trim()
  if (trimmedValue === "") return true

  // 1. 백엔드에서 내려준 정규식(regex)이 있으면 최우선으로 정밀 검증 수행
  if (regex) {
    try {
      // 백엔드에서 이중/삼중으로 이스케이프되어 넘어온 백슬래시(\\\\)를 단일 백슬래시(\)로 보정
      const normalizedRegex = regex.replace(/\\\\/g, "\\")
      const reg = new RegExp(normalizedRegex)
      return reg.test(trimmedValue)
    } catch (e) {
      console.error("Invalid regex pattern parser failed:", regex, e)
    }
  }

  // 2. 정규식이 없거나 실패한 경우 데이터 타입에 기반한 기본 검증 (Fallback)
  const lowerType = type ? type.toLowerCase() : ""
  const isNumeric = /^\d+(\.\d+)?$/.test(trimmedValue.replace(/[\s,]/g, ""))

  if (lowerType === "number" || lowerType === "int" || lowerType === "float" || lowerType === "double") {
    return isNumeric
  }
  if (lowerType === "phone") {
    // 대시 포함 형식 또는 단순 숫자 연속 형식 모두 유연하게 통과
    return /^\d{3}-\d{3,4}-\d{4}$/.test(trimmedValue) || /^\d{10,11}$/.test(trimmedValue)
  }
  if (lowerType === "biz-number" || lowerType === "biz_number") {
    return /^\d{3}-\d{2}-\d{5}$/.test(trimmedValue) || /^\d{10}$/.test(trimmedValue)
  }

  // string 및 기타 타입은 모든 형식 수용 (숫자 포함)
  return true
}

const getBadgeVariant = (dataType?: string | null) => {
  if (!dataType) return "default"
  const type = dataType.toLowerCase()
  if (type === "number" || type === "int" || type === "float" || type === "double") return "success"
  if (type === "phone") return "warning"
  if (type === "biz-number" || type === "biz_number" || type === "business") return "info"
  if (type === "string" || type === "text") return "default"
  return "default"
}

const getDataTypeLabel = (type?: string | null) => {
  if (!type) return ""
  return type.toLowerCase()
}

function DraggableBadge({ col, disabled }: { col: any; disabled: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: col.name,
    data: col,
    disabled,
  })

  const { selectedSystemColumn, setSelectedSystemColumn } = useExcelStore()
  const isSelected = selectedSystemColumn?.name === col.name

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        if (disabled) return
        e.stopPropagation()
        setSelectedSystemColumn(isSelected ? null : col)
      }}
      className={`relative touch-none ${isDragging ? "opacity-0" : "opacity-100"}`}
    >
      <Badge
        variant={getBadgeVariant(col.dataType)}
        className={`${!disabled ? "cursor-pointer shadow-sm hover:shadow-md" : ""} ${col.required ? "ring-2 ring-red-500/50" : ""
          } ${isSelected ? "ring-4 ring-blue-500 animate-pulse scale-110 z-10 transition-transform" : ""}`}
        title={col.description}
      >
        {col.name} {col.required && <span className="text-red-500 font-bold ml-0.5">*</span>}
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

function DraggableMappedBadge({ col, onCancel }: { col: any; onCancel: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: col.name,
    data: col,
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`absolute top-0.5 left-1/2 -translate-x-1/2 z-20 cursor-grab touch-none ${isDragging ? "opacity-0" : "opacity-100"}`}
    >
      <Badge
        variant={getBadgeVariant(col.dataType)}
        size="sm"
        className={`shadow-md transition-[background-color,color,transform] duration-200 hover:scale-105 active:scale-95 hover:bg-gray-500 hover:text-white border-transparent ${col.required ? "ring-2 ring-red-500/50" : ""
          }`}
        title="드래그하여 이동하거나 더블 클릭하여 매핑 해제"
        onDoubleClick={(e) => {
          e.stopPropagation()
          onCancel()
        }}
      >
        {col.name} {col.required && <span className="text-red-500 font-bold ml-0.5">*</span>}
      </Badge>
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
    headerBaseRow,
    recordHeight,
    targetColumns,
    isMappingConfirmed,
    isAnalysisDone,
    wasInitialFullMapping,
    setPage,
    setMode,
    resetSelection,
    fetchChunk,
    handleValidateExcelData,
    handleRowClick,
    handleHeaderCellClick,
    handleConfirmMapping,
    handleCellEdit,
    updateColumnMapping,
    confirmMappingCompletion,
    setIsMappingConfirmed,
    validationErrors,
    startRowIndex,
  } = useExcelStore()

  const pageSize = 20

  const columnCount = useMemo(() => {
    if (allData.length > 0) {
      return rowToValues(allData[0]).length
    }
    return 0
  }, [allData])

  // viewableRows, paginatedData, totalPages shifted down

  const schemaLookup = useMemo(() => {
    const map = new Map<string, any>()
    mappingResult?.flattenedData?.forEach((field: any) => {
      map.set(`${field.row}-${field.col}`, field)
    })
    return map
  }, [mappingResult])

  // 실제 데이터가 있는 마지막 행 인덱스 계산 (매핑된 컬럼들 기준)
  const lastContentRowIndex = useMemo(() => {
    // 1. 현재 매핑된 엑셀 컬럼 인덱스들만 추출
    const mappedExcelIndices = targetColumns
      .filter(
        (col) => col.frontColumn && col.excelColIndex !== null && col.excelColIndex !== undefined,
      )
      .map((col) => col.excelColIndex as number)

    if (mappedExcelIndices.length === 0) return -1

    // 2. 뒤에서부터 스캔하며 매핑된 열 중 하나라도 데이터가 들어있는 첫 번째 행을 찾음
    for (let i = allData.length - 1; i >= 0; i--) {
      const rowValues = rowToValues(allData[i])
      // 매핑된 열들 중에서 비어있지 않은 값이 하나라도 있는지 확인
      const hasDataInMappedCols = mappedExcelIndices.some((colIdx) => {
        const value = String(rowValues[colIdx] || "").trim()
        return value !== ""
      })

      if (hasDataInMappedCols) {
        return i
      }
    }
    return -1
  }, [allData, targetColumns])

  const [showErrorsOnly, setShowErrorsOnly] = useState(false)

  // 에러가 있는 레코드(멀티 행 묶음)의 모든 행 인덱스를 추출
  const invalidRowIndices = useMemo(() => {
    const indices = new Set<number>()
    // 매핑이 하나라도 되어 있는 경우 검증 시작
    if (lastContentRowIndex === -1) return indices

    const currentRecordHeight = recordHeight || 1

    // 검사 범위 결정: 마지막 콘텐츠 행이 속한 레코드 세트의 끝까지 검사
    const totalCheckRows =
      Math.ceil((lastContentRowIndex - sampleBaseRow + 1) / currentRecordHeight) *
      currentRecordHeight +
      sampleBaseRow

    for (
      let i = sampleBaseRow;
      i < totalCheckRows;
      i += currentRecordHeight
    ) {
      const recordRows = allData.slice(i, i + currentRecordHeight)
      let recordHasError = false

      for (const col of targetColumns) {
        if (col.frontColumn && col.excelColIndex !== null && col.excelColIndex !== undefined) {
          const relativeRow = currentRecordHeight === 1 ? 0 : col.relativeRowIndex || 0
          const targetRow = recordRows[relativeRow]
          const rowValues = targetRow ? rowToValues(targetRow) : Array(columnCount).fill("")
          const cellValue = String(rowValues[col.excelColIndex] || "").trim()

          // 1. 필수값 검증 (매핑된 컬럼 기준)
          if (col.required && cellValue === "") {
            recordHasError = true
            break
          }
          // (프론트엔드 성능을 위해 데이터 타입 검증은 백엔드에 위임하고 여기서는 필수값만 체크합니다)
        }
      }

      if (recordHasError) {
        for (let j = 0; j < currentRecordHeight; j++) {
          indices.add(i + j)
        }
      }
    }

    // 백엔드에서 반환된 에러(validationErrors) 행도 추가
    if (validationErrors && validationErrors.length > 0) {
      validationErrors.forEach((err) => {
        const localIdx = err.rowIndex - startRowIndex
        if (localIdx >= sampleBaseRow) {
          const recordStartIdx =
            sampleBaseRow +
            Math.floor((localIdx - sampleBaseRow) / currentRecordHeight) * currentRecordHeight
          for (let j = 0; j < currentRecordHeight; j++) {
            indices.add(recordStartIdx + j)
          }
        }
      })
    }

    return indices
  }, [
    allData,
    mappingResult,
    isMappingConfirmed,
    sampleBaseRow,
    recordHeight,
    targetColumns,
    schemaLookup,
    lastContentRowIndex,
    columnCount,
    validationErrors,
    startRowIndex,
  ])

  const viewableRows = useMemo(() => {
    return allData.map((row, index) => ({ row, index })).filter(({ index }) => {
      if (!showErrorsOnly) return true
      if (selectedHeaderRows.has(index)) return true
      if (invalidRowIndices.has(index)) return true
      return false
    })
  }, [allData, showErrorsOnly, selectedHeaderRows, invalidRowIndices])

  const paginatedData = useMemo(() => {
    const data = viewableRows.slice((page - 1) * pageSize, page * pageSize)
    if (data.length < pageSize) {
      const padding = Array(pageSize - data.length).fill({ row: null, index: -1 })
      return [...data, ...padding]
    }
    return data
  }, [viewableRows, page, pageSize])

  const totalPages = Math.max(1, Math.ceil(viewableRows.length / pageSize))


  // 타입 에러 체크(hasTypeError) 로직은 프론트엔드 성능을 위해 제거하고 백엔드로 위임합니다.
  const hasTypeError = false;
  [
    allData,
    mappingResult,
    sampleBaseRow,
    targetColumns,
    schemaLookup,
    lastContentRowIndex,
    columnCount,
  ]

  const hasHeaderSelected = selectedHeaderRows.size > 0

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const draggedCol = targetColumns.find((c) => c.name === active.id)
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

      // 헤더 시작 행으로부터의 상대적 위치 계산
      const relativeRow = r - headerBaseRow
      // 시각적 위치 추적을 위해 드롭된 헤더의 상대 위치를 그대로 저장합니다.
      // (단, 실제 백엔드 검증 시에는 recordHeight에 따라 0으로 치환하여 보냅니다.)
      const targetSchemaRow = (recordHeight === 1 ? 0 : relativeRow) + sampleBaseRow

      // 드래그 중인 컬럼 정보 및 타입 확인
      const draggedCol = active.data.current || targetColumns.find((col) => col.name === active.id)
      const systemDataType = draggedCol?.dataType

      // 드롭한 셀의 분석된 데이터 타입 확인 (상대 행 위치 기반)
      const colSchema = schemaLookup.get(`${targetSchemaRow}-${c}`)

      // 헤더와 데이터 영역 분석이 완료되었고 타입 정보가 존재하는 경우 타입 검증 수행
      if (isAnalysisDone && colSchema && systemDataType) {
        const sysType = systemDataType.toLowerCase()
        const excType = colSchema.type.toLowerCase()
        const systemRegex = draggedCol?.regex

        // 1단계: 타입이 일치하는지 우선 확인 (동일한 타입군)
        let isCompatible = false
        if (sysType === excType) {
          isCompatible = true
        } else if (sysType === "string") {
          isCompatible = true
        } else if (sysType === "number" || sysType === "int" || sysType === "float" || sysType === "double") {
          isCompatible = excType === "number"
        } else if (sysType === "phone") {
          isCompatible = excType === "phone"
        } else if (sysType === "biz-number" || sysType === "biz_number") {
          isCompatible = excType === "biz-number" || excType === "biz_number"
        }

        // 2단계: 타입이 일치하지 않을 때, 정규식(regex)을 적용하여 엑셀 샘플 데이터 값과 대조
        if (!isCompatible) {
          const sampleRow = allData[targetSchemaRow]
          const sampleRowValues = sampleRow ? rowToValues(sampleRow) : []
          const sampleValue = String(sampleRowValues[c] || "").trim()

          // 백엔드 정규식 규격에 일치한다면 매칭 허용
          if (systemRegex && isValidType(sampleValue, systemDataType, systemRegex)) {
            isCompatible = true
          }
        }

        if (isCompatible) {
          updateColumnMapping(draggedCol.name, excelHeaderName, c, relativeRow)
        } else {
          // 일치하지 않으면 경고 후 튕겨냄
          alert(`타입 불일치: '${excelHeaderName}' 열은 [${excType}] 형식이나, 시스템은 [${sysType}] 형식을 요구합니다.`)
        }
      } else {
        // 분석이 안 된 경우나 타입 정보가 없는 경우는 유연하게 무조건 허용
        if (draggedCol) {
          updateColumnMapping(draggedCol.name, excelHeaderName, c, relativeRow)
        }
      }
    }
  }

  const onCompleteClick = () => {
    // 1. 구조 해석 자동 실행
    // handleConfirmMapping()

    // 2. 매핑 완료 체크 및 진행
    const allMapped = targetColumns.every(
      (col) => col.excelColIndex !== null && col.excelColIndex !== undefined,
    )

    if (!allMapped) {
      const missing = targetColumns
        .filter((col) => col.excelColIndex === null || col.excelColIndex === undefined)
        .map((col) => col.name)
        .join(", ")
      if (!confirm(`아직 매핑되지 않은 항목(${missing})이 있습니다. 그래도 진행하시겠습니까?`)) {
        return
      }
    }

    confirmMappingCompletion()
    handleValidateExcelData()
  }

  // 매핑되지 않은 시스템 컬럼만 배지로 표시
  const unmappedColumns = useMemo(() => {
    return targetColumns.filter(
      (c) => c.excelColIndex === null || c.excelColIndex === undefined,
    )
  }, [targetColumns])

  // 매핑되지 않은 필수 시스템 컬럼이 있는지 확인
  const hasUnmappedRequiredColumns = useMemo(() => {
    return targetColumns.some(
      (col) => col.required && (col.excelColIndex === null || col.excelColIndex === undefined),
    )
  }, [targetColumns])

  // 수정 완료 버튼 활성화 조건
  // 2. 필수 컬럼 뱃지가 모두 매핑되어야 함 (!hasUnmappedRequiredColumns)
  const isCompleteButtonDisabled = useMemo(() => {
    return !isAnalysisDone || hasUnmappedRequiredColumns
  }, [isAnalysisDone, hasUnmappedRequiredColumns])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px 이상 이동해야 드래그가 시작됨 (클릭/더블클릭 보장)
      },
    }),
  )

  if (allData.length === 0) {
    return (
      <div className="mt-10 border-2 border-dashed p-10 text-center text-gray-400">
        파일을 업로드하면 여기에 데이터가 표시됩니다.
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      {unmappedColumns.length === 0 && (
        <div className="flex items-center gap-6 mb-4">
          <div className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              id="mapping-confirmation"
              checked={!isMappingConfirmed}
              onChange={(e) => setIsMappingConfirmed(!e.target.checked)}
              className="w-4 h-4 cursor-pointer"
            />
            <Label
              htmlFor="mapping-confirmation"
              className="text-sm font-semibold text-gray-700 cursor-pointer group-hover:text-blue-600 transition-colors"
            >
              매핑 정보 수정 모드
            </Label>
          </div>
          
          <div className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              id="show-errors-only"
              checked={showErrorsOnly}
              onChange={(e) => setShowErrorsOnly(e.target.checked)}
              className="w-4 h-4 cursor-pointer accent-red-500"
            />
            <Label
              htmlFor="show-errors-only"
              className="text-sm font-semibold text-red-600 cursor-pointer group-hover:text-red-700 transition-colors"
            >
              🚨 오류 데이터만 모아보기
            </Label>
          </div>
        </div>
      )}
      <div className="flex gap-2 p-2 border rounded mb-4 justify-between items-center bg-gray-50/50">
        <div className="flex items-center gap-6 ml-2">
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
            className={`shadow-md transition-all active:scale-95 ${isCompleteButtonDisabled
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700 text-white"
              }`}
            onClick={onCompleteClick}
            disabled={isCompleteButtonDisabled}
          >
            검증하기
          </Button>
        </div>
      </div>
      <div className="mt-6 flex flex-col">
        {/* 백엔드 시스템 컬럼 (D&D Source 영역) - 매핑 완료 시 스르륵 사라짐 */}
        <div
          className={`overflow-hidden transition-all duration-500 ease-in-out ${isMappingConfirmed ? "max-h-0 opacity-0 mb-0" : "max-h-[300px] opacity-100 mb-4"
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
                <div>
                  <div className="text-xs text-blue-600 font-medium">
                    드래그하여 아래 선택된 노란색 헤더 셀에 놓거나
                  </div>
                  <div className="text-xs text-blue-600 font-medium">
                    왼쪽 뱃지를 클릭하고 놓고 싶은 노란색 헤더 셀을 클릭하세요.
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 min-h-[28px]">
              {unmappedColumns.map((col) => (
                <div
                  key={col.name}
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

        <div className="overflow-x-auto w-full border border-gray-200 ">
          <table className="mx-auto w-max min-w-max border-collapse border-2 border-gray-800 ">
            <tbody>
              {paginatedData.map((item: any, localIndex: number) => {
                const { row, index: originalRowIndex } = item
                // 빈 행(padding)인 경우를 위해 가상의 rowIndex 계산 (원본 데이터 길이 너머의 고유 인덱스 부여)
                const rowIndex = originalRowIndex !== -1 ? originalRowIndex : allData.length + localIndex
                
                const isEmptyRow = row === null
                const isHeader = selectedHeaderRows.has(rowIndex)
                const isData = selectedSampleRows.has(rowIndex)
                const isEtc = selectedEtcRows.has(rowIndex)
                const rowValues = isEmptyRow ? Array(columnCount).fill("") : rowToValues(row)

                const isRecordEnd =
                  recordHeight > 1 &&
                  rowIndex >= sampleBaseRow &&
                  (rowIndex - sampleBaseRow + 1) % recordHeight === 0
                const isRowInvalid = invalidRowIndices.has(rowIndex)

                return (
                  <tr
                    key={`row-${rowIndex}-${localIndex}`}
                    className={`cursor-pointer ${isHeader ? "bg-yellow-200" : isData ? "bg-green-200" : isEtc ? "bg-blue-200" : isRowInvalid ? "bg-red-50" : "hover:bg-gray-50"} ${isRecordEnd ? "border-b-4 border-gray-800" : ""}`}
                  >
                    <td
                      onClick={() => handleRowClick(rowIndex)}
                      className="border-2 p-2 text-xs text-gray-400 bg-gray-50 w-12 text-center border-gray-800 whitespace-nowrap"
                    >
                      {rowIndex + 1}
                    </td>
                    {rowValues.map((cell, colIndex) => {
                      const relativeRow = (rowIndex - sampleBaseRow) % recordHeight

                      // 스키마(타입 정보)는 sampleBaseRow(첫 데이터 레코드)의 정보를 기준으로 조회합니다.
                      // 사용자가 아래에 새로 입력한 행들도 첫 레코드의 컬럼 타입을 따라가야 하기 때문입니다.
                      const targetSchemaRow = relativeRow + sampleBaseRow

                      const fieldSchema = schemaLookup.get(`${targetSchemaRow}-${colIndex}`)

                      // 해당 위치(열, 상대행)에 매핑된 시스템 컬럼이 있는지 확인
                      const mappedCol = targetColumns.find(
                        (col) =>
                          col.excelColIndex === colIndex &&
                          (recordHeight === 1 ? true : col.relativeRowIndex === relativeRow),
                      )

                      const absoluteRowIndex = row?.rowIndex ?? (rowIndex + startRowIndex)
                      const backendError = mappedCol
                        ? (validationErrors || []).find(err => err.rowIndex === absoluteRowIndex && err.columnCode === mappedCol.name)
                        : null

                      const isInvalid =
                        (rowIndex >= sampleBaseRow && // 데이터 샘플 영역 첫 행부터 검증 시작
                          rowIndex <= lastContentRowIndex && // 실제 값이 있는 마지막 행까지만 검사
                          mappedCol && // 매핑된 칸만 검증
                          (mappedCol.required && String(cell || "").trim() === "")) || // 필수 값 누락 체크만 수행
                        !!backendError // 백엔드 검증 에러

                      const isCellWhite = selectedHeaderCells.has(`${rowIndex}-${colIndex}`)
                      const isHeaderRowSelected = selectedHeaderRows.has(rowIndex)
                      const cellId = `${rowIndex}-${colIndex}`

                      // 분석된 컬럼 데이터 타입 구하기 (헤더 행의 상대적 위치 및 데이터 단수를 고려한 타겟 행 매칭)
                      const relativeHeaderRow = rowIndex - headerBaseRow
                      const targetDataRelativeRow = recordHeight === 1 ? 0 : relativeHeaderRow
                      const targetHeaderSchemaRow = targetDataRelativeRow + sampleBaseRow
                      const colSchema = isHeaderRowSelected
                        ? schemaLookup.get(`${targetHeaderSchemaRow}-${colIndex}`)
                        : null

                      // 통합된 targetColumns에서 이 셀에 매핑된 정보가 있는지 확인
                      const mappedColumn = targetColumns.find(
                        (col) =>
                          isHeaderRowSelected &&
                          col.excelColIndex === colIndex &&
                          ((col.relativeRowIndex ?? 0) === relativeHeaderRow)
                      )

                      const isCellEmpty = String(cell || "").trim() === ""

                      return (
                        <td
                          key={colIndex}
                          title={backendError ? backendError.errorMessage : undefined}
                          onClick={() => {
                            const { selectedSystemColumn, setSelectedSystemColumn } = useExcelStore.getState()

                            if (selectedSystemColumn && isHeaderRowSelected) {
                              // 클릭 매핑
                              updateColumnMapping(
                                selectedSystemColumn.name,
                                String(cell || "").trim(), // 드래그 방식과 동일하게 엑셀의 실제 헤더명을 전달
                                colIndex,
                                relativeHeaderRow // 시각적 위치 보존을 위해 원래 드롭/클릭된 상대 위치를 전달
                              )
                              setSelectedSystemColumn(null)
                            } else if (mode === "HEADER" && isHeaderRowSelected) {
                              handleHeaderCellClick(rowIndex, colIndex)
                            }
                          }}
                          className={`border-2 text-sm text-center border-gray-800 whitespace-nowrap w-12 transition-colors
                            ${isInvalid ? "border-red-500 bg-red-100" : ""} 
                            ${isCellWhite ? "bg-white" : isHeaderRowSelected ? "bg-yellow-200" : ""}
                            ${useExcelStore.getState().selectedSystemColumn && isHeaderRowSelected ? "cursor-crosshair hover:bg-blue-200" : mode === "HEADER" && isHeaderRowSelected ? "cursor-pointer hover:bg-yellow-300" : ""}
                          `}
                        >
                          <DroppableCell
                            id={cellId}
                            isSelected={isHeaderRowSelected && !isCellEmpty}
                          >
                            <div
                              className={`flex flex-col items-center justify-center p-1 relative transition-[min-height] duration-200 ${isHeaderRowSelected ? "min-h-[60px]" : "min-h-[50px]"}`}
                            >
                              {/* 기존 엑셀 컬럼명 (항상 정중앙 유지) */}
                              <div className="w-full h-full flex justify-center items-center z-0">
                                <Input
                                  autoWidth
                                  className={`bg-transparent text-center outline-none 
                                    ${isHeaderRowSelected ? "font-bold mt-2" : ""}`}
                                  value={String(cell || "")}
                                  onChange={(e) =>
                                    handleCellEdit(rowIndex, colIndex, e.target.value)
                                  }
                                />
                              </div>

                              {/* 매핑된 뱃지 및 체크 아이콘 표시 영역 */}
                              {isHeaderRowSelected && mappedColumn && (
                                <>
                                  {!isMappingConfirmed ? (
                                    <DraggableMappedBadge
                                      col={mappedColumn}
                                      onCancel={() =>
                                        updateColumnMapping(mappedColumn.name, null, null, null)
                                      }
                                    />
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
      <DragOverlay dropAnimation={null}>
        {activeCol ? (
          <Badge
            variant={getBadgeVariant(activeCol.dataType)}
            className={`cursor-grabbing shadow-lg scale-105 min-w-[100px] justify-center ${activeCol.required ? "ring-2 ring-red-500/50" : ""
              }`}
          >
            {activeCol.name}{" "}
            {activeCol.required && <span className="text-red-500 font-bold ml-0.5">*</span>}
          </Badge>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
