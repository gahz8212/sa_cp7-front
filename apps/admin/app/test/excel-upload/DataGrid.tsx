"use client"
import { useMemo, useState, useEffect } from "react"
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
  const [isMouseDown, setIsMouseDown] = useState(false)

  // 드래그 선택 중 마우스가 테이블 밖에서 떼어지는 예외 상황 방어
  useEffect(() => {
    const handleMouseUp = () => {
      setIsMouseDown(false)
    }
    window.addEventListener("mouseup", handleMouseUp)
    return () => {
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [])

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

  useEffect(() => {
    if (validationErrors && validationErrors.length > 0) {
      console.log("=== [Validation Errors Received] ===")
      validationErrors.forEach((err: any, idx: number) => {
        console.log(`Error ${idx}: rowIndex=${err.rowIndex}, columnCode=${err.columnCode}, errorMessage=${err.errorMessage}, invalidValue=${err.invalidValue}`);
      });
      console.log("====================================")
    }
  }, [validationErrors])

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
    if (validationErrors && validationErrors.length > 0) {
      validationErrors.forEach((err: any) => {
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

  // 오류 데이터 필터 변경 시 페이지를 1로 초기화 (빈 화면 방지)
  useEffect(() => {
    useExcelStore.setState({ page: 1 })
  }, [showErrorsOnly])

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
          <div className="flex gap-2 items-center">
            <Button
              variant={
                mode === "HEADER"
                  ? "primary"
                  : selectedHeaderRows.size > 0
                    ? "outline"
                    : "secondary"
              }
              className={
                mode !== "HEADER" && selectedHeaderRows.size > 0
                  ? "border-blue-500 text-blue-600 bg-blue-50 hover:bg-blue-100/70 font-semibold"
                  : ""
              }
              onClick={() => setMode("HEADER")}
              size="sm"
            >
              헤더 선택 {selectedHeaderRows.size > 0 && "✓"}
            </Button>
            {/* <Button
              variant={
                mode === "DATA"
                  ? "primary"
                  : selectedSampleRows.size > 0
                  ? "outline"
                  : "secondary"
              }
              className={
                mode !== "DATA" && selectedSampleRows.size > 0
                  ? "border-blue-500 text-blue-600 bg-blue-50 hover:bg-blue-100/70 font-semibold"
                  : ""
              }
              onClick={() => setMode("DATA")}
              size="sm"
            >
              데이터 선택 {selectedSampleRows.size > 0 && "✓"}
            </Button>
            <Button
              variant={
                mode === "ETC"
                  ? "primary"
                  : selectedEtcRows.size > 0
                  ? "outline"
                  : "secondary"
              }
              className={
                mode !== "ETC" && selectedEtcRows.size > 0
                  ? "border-blue-500 text-blue-600 bg-blue-50 hover:bg-blue-100/70 font-semibold"
                  : ""
              }
              onClick={() => setMode("ETC")}
              size="sm"
            >
              기타 선택 {selectedEtcRows.size > 0 && "✓"}
            </Button> */}
            <Button variant="secondary" onClick={resetSelection} size="sm">
              선택 영역 삭제
            </Button>






            {/* 툴팁 에니메이션 */}
            {/* 💡 단일 도움말 가이드 배지 (마우스 드래그 애니메이션 탑재) */}
            <div className="relative ml-1.5 flex items-center group">
              <span className="cursor-help flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-extrabold hover:bg-blue-200 transition-colors shadow-sm select-none">
                ?
              </span>

              {/* CSS group-hover 기반 팝업 노출 + 아래로 팝업 노출 */}
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2.5 z-50 hidden group-hover:block w-72 p-4 rounded-2xl border border-gray-200 bg-white shadow-2xl transition-all duration-200 animate-in fade-in slide-in-from-top-2">
                <div className="text-[11px] font-bold text-gray-800 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1">🖱️ 영역 설정 가이드</span>
                  <span className="text-[9px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-normal">미리보기 모션</span>
                </div>

                {/* CSS 가상 엑셀 모형 시트 */}
                <div className="relative border border-gray-300 rounded-lg overflow-hidden bg-gray-50 p-1 flex flex-col gap-1 select-none pointer-events-none w-full">
                  {/* 가상 마우스 커서 (Pointer SVG) */}
                  <div className="absolute z-30 pointer-events-none"
                    style={{
                      left: 0,
                      top: 0,
                      animation: "cursor-move 4s infinite ease-in-out",
                    }}>
                    <svg className="w-5 h-5 text-gray-900 drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M4.5 3v15.5l4.5-4.5h6.5L4.5 3z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
                    </svg>
                  </div>

                  <div className="flex gap-1 items-center h-7 px-1.5 text-[9px]  bg-gray-100 rounded border border-gray-200">
                    <span className="text-left p-1 bg-blue-500 text-black-500 rounded">헤더 선택</span>
                    <span className="text-left p-1 bg-gray-300 text-black-500 rounded">데이터 선택</span>
                  </div>

                  {/* 1번 가상 행 */}
                  <div className="flex gap-1 items-center h-7 px-1.5 text-[9px] text-gray-600 bg-white rounded border border-gray-200 transition-colors"
                    style={{ animation: "row-fill-1 4s infinite ease-in-out" }}>
                    <span className="w-6 text-center text-gray-400 font-bold border-r pr-1">1</span>
                    <span className="flex-grow pl-1 text-gray-500 font-medium">클릭!</span>
                  </div>

                  {/* 2번 가상 행 */}
                  <div className="flex gap-1 items-center h-7 px-1.5 text-[9px] text-gray-600 bg-white rounded border border-gray-200 transition-colors"
                    style={{ animation: "row-fill-2 4s infinite ease-in-out" }}>
                    <span className="w-6 text-center text-gray-400 font-bold border-r pr-1">2</span>
                    <span className="flex-grow pl-1 text-gray-500 font-medium">클릭!</span>
                  </div>
                </div>

                <p className="text-[9px] text-gray-400 mt-2.5 leading-relaxed text-center font-normal">
                  선택 모드를 누르고 좌측 행 번호를 클릭하세요
                </p>

                {/* CSS Keyframe 스타일 태그 주입 */}
                <style dangerouslySetInnerHTML={{
                  __html: `
                  /* 
                    [가이드 애니메이션 직접 수정 방법]
                    
                    1. 마우스 커서 움직임 조절 (@keyframes cursor-move)
                       - 🖱️ 포인터의 이동 경로 및 타이밍을 설정합니다.
                       - translate(X좌표, Y좌표) 값을 조절하여 드래그의 시작/끝 지점 좌표를 지정할 수 있습니다.
                       - scale(0.8)은 클릭 시 작아지는 반응(마우스 다운 상태)을 모사합니다.
                       
                    2. 행 색상 하이라이트 타이밍 조절 (@keyframes row-fill-1 / row-fill-2)
                       - 마우스가 클릭된 상태에서 아래로 지나갈 때 각 행의 배경색이 노란색(rgba)으로 채워지는 시점을 조절합니다.
                       - rgba(254, 240, 138, 0.7) 대신 다른 색상 코드를 넣어 헤더(노랑), 데이터(초록) 등의 드래그 효과를 시뮬레이션할 수 있습니다.
                  */
                  @keyframes cursor-move {
                    0% { transform: translate(15px, 20px)  }
                    10% { transform: translate(5px, 20px) scale(0.8);; }
                    15% { transform: translate(15px, 20px) scale(1); }
                    20% { transform: translate(15px, 42px); }
                    30% { transform: translate(15px, 42px) scale(0.8); }
                    40% { transform: translate(15px, 42px) scale(1.0); }
                    60% { transform: translate(15px, 72px) scale(0.8); }
                    75% { transform: translate(15px, 72px) scale(1); }
                    90% { transform: translate(5px, 20px); }
                    100% { transform: translate(5px, 20px); }
                  }
                  @keyframes row-fill-1 {
                    0% { background-color: #ffffff; }
                    28% { background-color: #ffffff; }
                    30% { background-color: rgba(254, 240, 138, 0.7); }
                    85% { background-color: rgba(254, 240, 138, 0.7); }
                    95% { background-color: #ffffff; }
                    100% { background-color: #ffffff; }
                  }
                  @keyframes row-fill-2 {
                    0% { background-color: #ffffff; }
                    58% { background-color: #ffffff; }
                    60% { background-color: rgba(254, 240, 138, 0.7); }
                    85% { background-color: rgba(254, 240, 138, 0.7); }
                    95% { background-color: #ffffff; }
                    100% { background-color: #ffffff; }
                  }
                `}} />
              </div>
            </div>
          </div>
        </div>
        {/* 툴팁 에니메이션 */}
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
          className={`transition-all duration-500 ease-in-out ${isMappingConfirmed ? "max-h-0 opacity-0 mb-0 overflow-hidden" : "max-h-[500px] opacity-100 mb-4 overflow-visible"
            }`}
        >
          <div
            className={`p-4 border rounded-lg transition-colors ${hasHeaderSelected ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"}`}
          >
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-1.5">
                <div
                  className={`text-sm font-bold ${hasHeaderSelected ? "text-blue-800" : "text-gray-500"}`}
                >
                  매핑할 시스템 컬럼
                </div>

                {/* 💡 매핑 가이드 도움말 배지 */}
                <div className="relative flex items-center group">
                  <span className="cursor-help flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 text-blue-800 text-[10px] font-extrabold hover:bg-blue-200 transition-colors shadow-sm select-none">
                    ?
                  </span>

                  {/* CSS group-hover 기반 팝업 노출 */}
                  <div className="absolute left-0 top-full mt-2.5 z-50 hidden group-hover:block w-[460px] p-4 rounded-2xl border border-gray-200 bg-white shadow-2xl transition-all duration-200 animate-in fade-in slide-in-from-top-2">
                    <div className="text-[11px] font-bold text-gray-800 mb-2 flex items-center justify-between select-none">
                      <span className="flex items-center gap-1">🖱️ 시스템 컬럼 매핑 방법 (2가지)</span>
                      <span className="text-[9px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-normal">실시간 시뮬레이션</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 divide-x divide-gray-150">
                      {/* 왼쪽: 방법 1 */}
                      <div className="flex flex-col gap-2">
                        <div className="text-[9.5px] font-bold text-gray-700">방법 1: 드래그 앤 드롭</div>

                        <div className="relative flex justify-between items-center gap-1 p-2 h-16 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden select-none pointer-events-none w-full">
                          {/* 가상 마우스 커서 1 */}
                          <div className="absolute z-30 pointer-events-none"
                            style={{
                              left: 0,
                              top: 0,
                              animation: "map-cursor-move-1 4s infinite ease-in-out",
                            }}>
                            <svg className="w-4 h-4 text-gray-900 drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)]" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M4.5 3v15.5l4.5-4.5h6.5L4.5 3z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
                            </svg>
                          </div>

                          {/* 시스템 컬럼 소스 배지 */}
                          <div className="flex flex-col gap-0.5 items-start">
                            <span className="text-[6.5px] text-gray-400 font-bold scale-90 origin-left">시스템 컬럼</span>
                            <div className="px-1 py-0.5 bg-blue-100 text-blue-800 text-[8.5px] font-bold rounded border border-blue-200 shadow-sm relative transition-all"
                              style={{ animation: "badge-state-1 4s infinite ease-in-out" }}>
                              이름 *
                            </div>
                          </div>

                          {/* 화살표 */}
                          <div className="text-gray-300 text-[10px]">➔</div>

                          {/* 헤더 대상 셀 */}
                          <div className="flex flex-col gap-0.5 items-start mr-1">
                            <span className="text-[6.5px] text-gray-400 font-bold scale-90 origin-left">엑셀 헤더 셀</span>
                            <div className="w-12 h-6 bg-yellow-100 border border-yellow-400 rounded flex flex-col items-center justify-center relative overflow-hidden">
                              <span className="text-[8.5px] text-yellow-900 font-bold">성명</span>

                              <div className="absolute top-0 bottom-0 left-0 right-0 bg-blue-500 text-white text-[8px] font-bold flex items-center justify-center scale-0 whitespace-nowrap transition-transform"
                                style={{ animation: "mapped-badge-scale-1 4s infinite ease-in-out" }}>
                                이름 *
                              </div>
                            </div>
                          </div>
                        </div>
                        <p className="text-[8.5px] text-gray-400 leading-normal">
                          배지를 마우스로 끌어서 매핑할 노란색 헤더 셀 위에 떨어뜨립니다.
                        </p>
                      </div>

                      {/* 오른쪽: 방법 2 */}
                      <div className="flex flex-col gap-2 pl-4">
                        <div className="text-[9.5px] font-bold text-gray-700">방법 2: 클릭 ➔ 클릭</div>

                        <div className="relative flex justify-between items-center gap-1 p-2 h-16 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden select-none pointer-events-none w-full">
                          {/* 가상 마우스 커서 2 */}
                          <div className="absolute z-30 pointer-events-none"
                            style={{
                              left: 0,
                              top: 0,
                              animation: "map-cursor-move-2 4s infinite ease-in-out",
                            }}>
                            <svg className="w-4 h-4 text-gray-900 drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)]" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M4.5 3v15.5l4.5-4.5h6.5L4.5 3z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
                            </svg>
                          </div>

                          {/* 시스템 컬럼 소스 배지 */}
                          <div className="flex flex-col gap-0.5 items-start">
                            <span className="text-[6.5px] text-gray-400 font-bold scale-90 origin-left">시스템 컬럼</span>
                            <div className="px-1 py-0.5 bg-blue-100 text-blue-800 text-[8.5px] font-bold rounded border border-blue-200 shadow-sm relative transition-all"
                              style={{ animation: "badge-state-2 4s infinite ease-in-out" }}>
                              이름 *
                            </div>
                          </div>

                          {/* 화살표 */}
                          <div className="text-gray-300 text-[10px]">➔</div>

                          {/* 헤더 대상 셀 */}
                          <div className="flex flex-col gap-0.5 items-start mr-1">
                            <span className="text-[6.5px] text-gray-400 font-bold scale-90 origin-left">엑셀 헤더 셀</span>
                            <div className="w-12 h-6 bg-yellow-100 border border-yellow-400 rounded flex flex-col items-center justify-center relative overflow-hidden">
                              <span className="text-[8.5px] text-yellow-900 font-bold">성명</span>

                              <div className="absolute top-0 bottom-0 left-0 right-0 bg-blue-500 text-white text-[8px] font-bold flex items-center justify-center scale-0 whitespace-nowrap transition-transform"
                                style={{ animation: "mapped-badge-scale-2 4s infinite ease-in-out" }}>
                                이름 *
                              </div>
                            </div>
                          </div>
                        </div>
                        <p className="text-[8.5px] text-gray-400 leading-normal">
                          배지를 먼저 클릭(파란 테두리 활성)한 후 매핑할 노란색 셀을 클릭합니다.
                        </p>
                      </div>
                    </div>

                    {/* CSS Keyframe 스타일 태그 주입 */}
                    <style dangerouslySetInnerHTML={{
                      __html: `
                      @keyframes map-cursor-move-1 {
                        0%   { transform: translate(5px, 5px) scale(1); }
                        15%  { transform: translate(25px, 20px) scale(1); }
                        22%  { transform: translate(25px, 20px) scale(0.75); }
                        52%  { transform: translate(110px, 20px) scale(0.75); }
                        60%  { transform: translate(110px, 20px) scale(1); }
                        85%  { transform: translate(5px, 5px) scale(1); }
                        100% { transform: translate(5px, 5px) scale(1); }
                      }
                      
                      @keyframes badge-state-1 {
                        0%   { opacity: 1; }
                        12%  { opacity: 0.5; }
                        52%  { opacity: 0.5; }
                        60%  { opacity: 0.2; }
                        85%  { opacity: 0.2; }
                        90%  { opacity: 1; }
                        100% { opacity: 1; }
                      }
                      
                      @keyframes mapped-badge-scale-1 {
                        0%   { transform: scale(0); }
                        55%  { transform: scale(0); }
                        60%  { transform: scale(1); }
                        85%  { transform: scale(1); }
                        90%  { transform: scale(0); }
                        100% { transform: scale(0); }
                      }
                      
                      @keyframes map-cursor-move-2 {
                        0%   { transform: translate(5px, 5px) scale(1); }
                        15%  { transform: translate(25px, 20px) scale(1); }
                        22%  { transform: translate(25px, 20px) scale(0.75); }
                        30%  { transform: translate(25px, 20px) scale(1); }
                        50%  { transform: translate(110px, 20px) scale(1); }
                        58%  { transform: translate(110px, 20px) scale(0.75); }
                        66%  { transform: translate(110px, 20px) scale(1); }
                        85%  { transform: translate(5px, 5px) scale(1); }
                        100% { transform: translate(5px, 5px) scale(1); }
                      }
                      
                      @keyframes badge-state-2 {
                        0%   { border-color: #bfdbfe; box-shadow: none; opacity: 1; }
                        22%  { border-color: #3b82f6; box-shadow: 0 0 4px rgba(59, 130, 246, 0.5); }
                        58%  { border-color: #3b82f6; box-shadow: 0 0 4px rgba(59, 130, 246, 0.5); }
                        60%  { opacity: 0.2; border-color: #bfdbfe; box-shadow: none; }
                        85%  { opacity: 0.2; }
                        90%  { opacity: 1; }
                        100% { opacity: 1; }
                      }
                      
                      @keyframes mapped-badge-scale-2 {
                        0%   { transform: scale(0); }
                        58%  { transform: scale(0); }
                        66%  { transform: scale(1); }
                        85%  { transform: scale(1); }
                        90%  { transform: scale(0); }
                        100% { transform: scale(0); }
                      }
                    `}} />
                  </div>
                </div>
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
                // 현재 페이지의 실제 데이터 개수 (index가 -1이 아닌 것들의 수)
                const currentDataLength = paginatedData.length - paginatedData.filter((i: any) => i.index === -1).length
                // 빈 행(padding)인 경우 원본 데이터 길이(allData.length)에 이어서 순차적인 번호 부여
                const rowIndex = originalRowIndex !== -1 ? originalRowIndex : allData.length + (localIndex - currentDataLength)

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

                const hoverClass =
                  mode === "HEADER" ? "hover:bg-yellow-100/60" :
                    mode === "DATA" ? "hover:bg-green-100/60" :
                      mode === "ETC" ? "hover:bg-blue-100/60" :
                        "hover:bg-gray-50";

                return (
                  <tr
                    key={`row-${rowIndex}-${localIndex}`}
                    className={`select-none cursor-pointer transition-colors duration-150 ${isHeader ? "bg-yellow-50" : isData ? "bg-green-50" : isEtc ? "bg-blue-50" : isRowInvalid ? "bg-red-50" : hoverClass} ${isRecordEnd ? "border-b-4 border-gray-800" : ""}`}
                  >
                    <td
                      onMouseDown={() => {
                        if (mode) {
                          setIsMouseDown(true);
                          handleRowClick(rowIndex);
                        }
                      }}
                      onMouseEnter={() => {
                        if (isMouseDown && mode) {
                          handleRowClick(rowIndex);
                        }
                      }}
                      className="border-2 p-2 text-xs text-gray-500 bg-gray-100/80 w-14 text-center border-gray-800 whitespace-nowrap select-none hover:bg-gray-200 transition-colors font-medium relative"
                      title={mode ? "마우스 드래그로 연속 선택 가능" : "상단 모드 클릭 후 선택"}
                    >
                      <div className="flex items-center justify-between px-1">
                        {/* 상태 배지 인디케이터 */}
                        <span className="w-2 h-2 rounded-full inline-block mr-1 flex-shrink-0"
                          style={{
                            backgroundColor: isHeader ? "#eab308" : isData ? "#22c55e" : isEtc ? "#3b82f6" : "transparent",
                            border: isHeader || isData || isEtc ? "none" : "1px solid #d1d5db"
                          }}
                        />
                        <span className="flex-grow text-center font-mono">{rowIndex + 1}</span>
                      </div>
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
                        ? (validationErrors || []).find((err: any) =>
                          err.rowIndex === absoluteRowIndex &&
                          (err.columnCode === mappedCol.name || err.columnCode === mappedCol.frontColumn)
                        )
                        : null

                      const isInvalid = !!backendError // 백엔드 검증 에러

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
                            ${isInvalid ? "border-amber-500 bg-amber-100" : ""} 
                            ${isCellWhite ? "bg-white" : isHeaderRowSelected ? "bg-yellow-50" : ""}
                            ${useExcelStore.getState().selectedSystemColumn && isHeaderRowSelected ? "cursor-crosshair hover:bg-blue-200" : mode === "HEADER" && isHeaderRowSelected ? "cursor-pointer hover:bg-yellow-200" : ""}
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
