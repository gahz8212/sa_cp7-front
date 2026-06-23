import { create } from "zustand"
import axios from "axios"

export type SelectionMode = "HEADER" | "DATA" | "ETC" | null

export const rowToValues = (row: any) => {
  if (row === null || row === undefined) return []
  return (Object.values(row).find((v) => Array.isArray(v)) as any[]) || Object.values(row)
}

// 행 데이터에서 빈 열들을 잘라내기 위한 좌우 경계값 계산 헬퍼 함수
export const getActiveColumnBounds = (rawRows: any[]): { left: number; right: number } => {
  if (rawRows.length === 0) return { left: 0, right: 0 }

  const firstRowValues = rowToValues(rawRows[0])
  const maxCols = firstRowValues.length

  let left = 0
  let right = maxCols - 1

  // 1. 왼쪽 빈 컬럼 오프셋 구하기
  for (let c = 0; c < maxCols; c++) {
    const isAllEmpty = rawRows.every((row) => {
      const rowValues = rowToValues(row)
      const val = rowValues[c]
      return val === undefined || val === null || String(val).trim() === ""
    })
    if (isAllEmpty) {
      left++
    } else {
      break
    }
  }

  // 2. 오른쪽 빈 컬럼 오프셋 구하기
  for (let c = maxCols - 1; c >= left; c--) {
    const isAllEmpty = rawRows.every((row) => {
      const rowValues = rowToValues(row)
      const val = rowValues[c]
      return val === undefined || val === null || String(val).trim() === ""
    })
    if (isAllEmpty) {
      right--
    } else {
      break
    }
  }

  return { left, right }
}

// 행 데이터에서 빈 행들을 잘라내기 위한 상하 경계값 계산 헬퍼 함수
export const getActiveRowBounds = (rawRows: any[]): { top: number; bottom: number } => {
  if (rawRows.length === 0) return { top: 0, bottom: 0 }

  let top = 0
  let bottom = rawRows.length - 1

  // 1. 위쪽 빈 행 오프셋 구하기
  for (let r = 0; r < rawRows.length; r++) {
    const rowValues = rowToValues(rawRows[r])
    const isAllEmpty = rowValues.every(
      (val) => val === undefined || val === null || String(val).trim() === ""
    )
    if (isAllEmpty) {
      top++
    } else {
      break
    }
  }

  // 2. 아래쪽 빈 행 오프셋 구하기
  for (let r = rawRows.length - 1; r >= top; r--) {
    const rowValues = rowToValues(rawRows[r])
    const isAllEmpty = rowValues.every(
      (val) => val === undefined || val === null || String(val).trim() === ""
    )
    if (isAllEmpty) {
      bottom--
    } else {
      break
    }
  }

  return { top, bottom }
}

/**
 * 행의 타입 시그니처를 기반으로 데이터 시작 행과 레코드 높이를 자동으로 추정합니다.
 *
 * 핵심 원리:
 *   - 헤더 행: 모든 셀이 string 또는 empty  → [string, string, empty, string]
 *   - 데이터 행: number가 하나 이상 포함     → [string, number, string, number]
 *   - recordHeight=1: 동일 시그니처가 바로 반복
 *   - recordHeight=2: 시그니처 A, B가 교대로 반복 (A,B,A,B...)
 */
const detectDataArea = (rows: any[]): { dataStartRow: number; recordHeight: number } => {
  const SCAN_LIMIT = Math.min(rows.length, 30)

  type CellType = 'number' | 'string' | 'empty'
  type Signature = CellType[]

  // 셀 값 → 타입 판별
  const getCellType = (val: string): CellType => {
    const trimmed = val.trim()
    if (!trimmed) return 'empty'
    // 하이픈·쉼표·퍼센트 제거 후 순수 숫자인지 확인
    // ex) "010-1234-5678" → "01012345678" → number
    //     "1,234,567"     → "1234567"     → number
    const cleaned = trimmed.replace(/[-,]/g, '').replace(/%$/, '')
    if (cleaned !== '' && !isNaN(Number(cleaned))) return 'number'
    return 'string'
  }

  // 행 → 타입 시그니처
  const getSignature = (row: any): Signature =>
    rowToValues(row).map((v) => getCellType(String(v ?? '')))

  // 전체 빈 행 여부: 모든 셀이 empty이면 true
  const isBlankRow = (sig: Signature): boolean => sig.every((t) => t === 'empty')

  // 헤더 여부: number가 하나도 없으면 헤더
  const isHeader = (sig: Signature): boolean => sig.every((t) => t !== 'number')

  // 데이터 여부: number가 하나 이상 있으면 데이터
  const isData = (sig: Signature): boolean => sig.some((t) => t === 'number')

  // 두 시그니처가 "같은 패턴"인지 비교 (empty는 와일드카드로 취급)
  const sigMatch = (a: Signature, b: Signature): boolean => {
    const len = Math.max(a.length, b.length)
    for (let i = 0; i < len; i++) {
      const ta = a[i] ?? 'empty'
      const tb = b[i] ?? 'empty'
      if (ta === 'empty' || tb === 'empty') continue  // 빈 셀은 무시
      if (ta !== tb) return false
    }
    return true
  }

  const sigs = rows.slice(0, SCAN_LIMIT).map(getSignature)

  // STEP 1. 전체 빈 행은 무시하고, 첫 번째 데이터 행 위치 탐색
  let dataFirstRow = -1
  for (let i = 0; i < SCAN_LIMIT; i++) {
    if (isBlankRow(sigs[i])) continue   // 전체 빈 행 → 무시
    if (isData(sigs[i])) {
      dataFirstRow = i
      break
    }
  }

  // 데이터 행을 전혀 못 찾은 경우 폴백
  if (dataFirstRow < 0) return { dataStartRow: Math.min(1, rows.length - 1), recordHeight: 1 }

  // STEP 2. recordHeight=1 탐색
  //   데이터 첫 행(A)과 그 다음 행(A')이 같은 시그니처로 반복되면 → 1행 레코드
  if (dataFirstRow + 1 < SCAN_LIMIT && sigMatch(sigs[dataFirstRow], sigs[dataFirstRow + 1])) {
    return { dataStartRow: dataFirstRow, recordHeight: 1 }
  }

  // STEP 3. recordHeight=2 탐색
  //   [A, B, A, B] 패턴이면 → 2행 레코드
  if (dataFirstRow + 3 < SCAN_LIMIT) {
    const sigA  = sigs[dataFirstRow]
    const sigB  = sigs[dataFirstRow + 1]
    const sigA2 = sigs[dataFirstRow + 2]
    const sigB2 = sigs[dataFirstRow + 3]
    if (sigMatch(sigA, sigA2) && sigMatch(sigB, sigB2)) {
      return { dataStartRow: dataFirstRow, recordHeight: 2 }
    }
  }

  // 폴백: 찾은 데이터 첫 행, 1행 레코드
  return { dataStartRow: dataFirstRow, recordHeight: 1 }
}

interface ValidationError {
  rowIndex: number
  columnCode: string
  errorMessage: string
  invalidValue?: string
}

interface TargetColumn {
  name: string
  description: string
  required: boolean
  dataType?: string | null
  regex?: string | null
  frontColumn?: string | null // 매핑된 엑셀 컬럼명
  excelColIndex?: number | null // 매핑된 엑셀 컬럼 인덱스
  relativeRowIndex?: number | null // 매핑된 엑셀 상대 행 인덱스 (헤더 내 위치)
}

interface ExcelState {
  file: File | null
  fileKey: string | null
  fileInfo: { name: string; size: number } | null
  allData: any[]
  allOriginalData: any[]
  totalCount: number
  loadedChunks: Set<number>
  uploadProgress: number
  isUploading: boolean
  page: number
  mappingResult: any
  selectedHeaderCells: Set<string>
  mode: SelectionMode
  selectedHeaderRows: Set<number>
  selectedSampleRows: Set<number>
  selectedEtcRows: Set<number>
  headerBaseRow: number
  sampleBaseRow: number
  etcBaseRow: number
  headerHeight: number
  recordHeight: number
  etcHeight: number
  targetColumns: TargetColumn[]
  isMappingConfirmed: boolean
  isAnalysisDone: boolean
  wasInitialFullMapping: boolean
  startColIndex: number
  startRowIndex: number
  validationErrors: any[]
  selectedSystemColumn: any | null
}

interface ExcelActions {
  setFile: (file: File | null) => void
  setMode: (mode: SelectionMode) => void
  setPage: (page: number) => void
  setValidationErrors: (errors: any[]) => void
  setSelectedSystemColumn: (col: any | null) => void
  resetSelection: () => void
  resetAll: () => void

  fetchChunk: (chunkIndex: number, isInitial?: boolean) => Promise<void>
  handleUpload: () => void
  handleValidateExcelData: () => void
  setValidationErrors: (errors: ValidationError[]) => void

  handleRowClick: (rowIndex: number) => void
  handleHeaderCellClick: (rowIndex: number, colIndex: number) => void
  handleConfirmMapping: () => void
  handleCellEdit: (rowIndex: number, colIndex: number, newValue: string) => void
  setMappingResult: (result: any) => void
  setTargetColumns: (columns: TargetColumn[]) => void
  updateColumnMapping: (
    name: string,
    frontColumn: string | null,
    colIndex: number | null,
    relativeRowIndex?: number | null,
  ) => void
  confirmMappingCompletion: () => void
  setIsMappingConfirmed: (isConfirmed: boolean) => void
}

export const useExcelStore = create<ExcelState & ExcelActions>((set, get) => ({
  file: null,
  fileKey: null,
  fileInfo: null,
  allData: [],
  allOriginalData: [],
  totalCount: 0,
  loadedChunks: new Set(),
  uploadProgress: 0,
  isUploading: false,
  page: 1,
  mappingResult: null,
  selectedHeaderCells: new Set(),
  mode: null,
  selectedHeaderRows: new Set(),
  selectedSampleRows: new Set(),
  selectedEtcRows: new Set(),
  headerBaseRow: 0,
  sampleBaseRow: 0,
  etcBaseRow: 0,
  headerHeight: 0,
  recordHeight: 0,
  etcHeight: 0,
  // 백엔드에서 받아온 매핑 대상 컬럼
  targetColumns: [],
  isMappingConfirmed: false,
  isAnalysisDone: false,
  wasInitialFullMapping: false,
  startColIndex: 0,
  startRowIndex: 0,

  confirmMappingCompletion: () => {
    const allMapped = get().targetColumns.every(
      (col) => col.excelColIndex !== null && col.excelColIndex !== undefined,
    )
    if (allMapped) {
      set({ isMappingConfirmed: true })
    }
  },

  setIsMappingConfirmed: (isMappingConfirmed) => {
    if (isMappingConfirmed) {
      const allMapped = get().targetColumns.every(
        (col) => col.excelColIndex !== null && col.excelColIndex !== undefined,
      )
      if (!allMapped) return
    }
    set({ isMappingConfirmed })
  },

  setTargetColumns: (columns) => set({ targetColumns: columns }),

  updateColumnMapping: (name, frontColumn, colIndex, relativeRowIndex) =>
    set((prev) => {
      const nextTargetColumns = prev.targetColumns.map((col) => {
        // 1. 해당 시스템 컬럼의 매핑 정보를 업데이트
        if (col.name === name) {
          return { ...col, frontColumn, excelColIndex: colIndex, relativeRowIndex }
        }
        // 2. 다른 시스템 컬럼이 이미 이 위치(행, 열)에 매핑되어 있었다면 해제 (1:1 매핑 유지)
        if (
          frontColumn &&
          col.frontColumn === frontColumn &&
          col.excelColIndex === colIndex &&
          col.relativeRowIndex === relativeRowIndex
        ) {
          return { ...col, frontColumn: null, excelColIndex: null, relativeRowIndex: null }
        }
        return col
      })

      // 매핑이 변경되었으므로 자동 검증 트리거
      setTimeout(() => {
        get().handleConfirmMapping()
      }, 0)

      return { targetColumns: nextTargetColumns, isMappingConfirmed: false }
    }),

  setFile: (file) => {
    if (file) {
      set({
        file,
        fileKey: null,      // 새 파일 업로드 시 이전 fileKey 반드시 초기화
        fileInfo: { name: file.name, size: file.size },
        allData: [],
        allOriginalData: [],
        totalCount: 0,
        loadedChunks: new Set(),
        page: 1,
        selectedHeaderRows: new Set(),
        selectedSampleRows: new Set(),
        selectedEtcRows: new Set(),
        selectedHeaderCells: new Set(),
        mode: null,
        mappingResult: null,
        headerBaseRow: 0,
        sampleBaseRow: 0,
        etcBaseRow: 0,
        headerHeight: 0,
        recordHeight: 0,
        etcHeight: 0,
        targetColumns: [],
        isMappingConfirmed: false,
        isAnalysisDone: false,
        wasInitialFullMapping: false,
        startColIndex: 0,
        startRowIndex: 0,
        validationErrors: [],
        selectedSystemColumn: null,
      })
    } else {
      get().resetAll()
    }
  },

  setMode: (mode) => {
    set((prev) => {
      const updates: Partial<ExcelState> = { mode }
      if (mode === "HEADER") {
        updates.selectedHeaderRows = new Set()
        updates.selectedHeaderCells = new Set()
        updates.headerBaseRow = 0
        updates.headerHeight = 0
        updates.isAnalysisDone = false
        updates.mappingResult = null
      } else if (mode === "DATA") {
        updates.selectedSampleRows = new Set()
        updates.sampleBaseRow = 0
        updates.recordHeight = 0
        updates.isAnalysisDone = false
        updates.mappingResult = null
      } else if (mode === "ETC") {
        updates.selectedEtcRows = new Set()
        updates.etcBaseRow = 0
        updates.etcHeight = 0
        updates.isAnalysisDone = false
        updates.mappingResult = null
      }
      return updates
    })
  },

  setPage: (page) => set({ page }),
  setMappingResult: (mappingResult) => set({ mappingResult }),

  resetSelection: () => {
    const { mode } = get()
    if (mode === "HEADER") {
      set({ selectedHeaderRows: new Set(), selectedHeaderCells: new Set() })
    } else if (mode === "DATA") {
      set({ selectedSampleRows: new Set() })
    } else if (mode === "ETC") {
      set({ selectedEtcRows: new Set() })
    }
  },

  resetAll: () => {
    set({
      file: null,
      fileInfo: null,
      allData: [],
      allOriginalData: [],
      totalCount: 0,
      loadedChunks: new Set(),
      uploadProgress: 0,
      isUploading: false,
      page: 1,
      mappingResult: null,
      selectedHeaderCells: new Set(),
      mode: null,
      selectedHeaderRows: new Set(),
      selectedSampleRows: new Set(),
      selectedEtcRows: new Set(),
      headerBaseRow: 0,
      sampleBaseRow: 0,
      etcBaseRow: 0,
      headerHeight: 0,
      recordHeight: 0,
      etcHeight: 0,
      targetColumns: [],
      isMappingConfirmed: false,
      isAnalysisDone: false,
      wasInitialFullMapping: false,
      startColIndex: 0,
      startRowIndex: 0,
      validationErrors: [],
      selectedSystemColumn: null,
    })
  },

  setSelectedSystemColumn: (col) => set({ selectedSystemColumn: col }),

  fetchChunk: async (chunkIndex, isInitial = false) => {
    const { loadedChunks, file } = get()
    if (loadedChunks.has(chunkIndex)) return
    if (!file) return

    try {
      if (isInitial) {
        set({ isUploading: true, uploadProgress: 5 })
      }

      const formData = new FormData()
      formData.append("file", file)
      formData.append("sheetNo", "0")
      formData.append("page", (chunkIndex + 1).toString())
      formData.append("size", "15")

      const response = await axios.post("/api/common/upload-excel", formData, {
        onUploadProgress: (progressEvent) => {
          if (isInitial && progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 45) / progressEvent.total)
            set({ uploadProgress: 5 + percentCompleted }) // 5% ~ 50%
          }
        },
      })
      console.log("Chunk response:", response.data)
      if (response.data) {
        if (isInitial) {
          set({ uploadProgress: 55 })
          
          const backendFileKey = response.data.data?.uploadExcelKey || response.data.uploadExcelKey || response.data.fileKey || response.data.data?.fileKey || response.data.file_key || response.data.data?.file_key || null
          if (backendFileKey) {
            set({ fileKey: backendFileKey })
          }

          // 첫 청크 로드 시 targetColumns가 서버 응답에 있다면 상태에 저장합니다.
          const backendTargetColumns =
            response.data.targetColumns || response.data.data?.targetColumns
          if (backendTargetColumns) {
            // 모든 frontColumn이 null이 아닌지 확인 (수정 모드 노출 여부 결정)
            const allMapped =
              backendTargetColumns.length > 0 &&
              backendTargetColumns.every(
                (col: any) => col.frontColumn !== null && col.frontColumn !== undefined,
              )

            // 프론트에서 사용할 수 있도록 frontColumn, excelColIndex를 명시적으로 초기화 (이미 있으면 유지)
            const initializedColumns = backendTargetColumns.map((col: any) => ({
              ...col,
              frontColumn: col.frontColumn || null,
              excelColIndex: col.excelColIndex ?? null,
              dataType: col.dataType ?? null,
              regex: col.regex ?? null,
            }))
            set({
              targetColumns: initializedColumns,
              wasInitialFullMapping: allMapped,
              isMappingConfirmed: allMapped,
            })

            // 자동 검증 실행: 매핑 정보가 있는 경우에만
            if (allMapped) {
              setTimeout(() => {
                get().handleConfirmMapping()
              }, 0)
            }
          }
        }

        const rawRows = response.data.dataList || response.data.data?.dataList || []
        const totalRows = rawRows.length

        // 유효한 열 영역(Bounds) 감지
        const { left, right } = getActiveColumnBounds(rawRows)
        set({ startColIndex: left })

        // 유효한 행 영역(Bounds) 감지 및 잘라내기
        const { top, bottom } = getActiveRowBounds(rawRows)
        set({ startRowIndex: top })

        // 유효 행 영역만큼 데이터 슬라이싱
        const slicedRows = rawRows.slice(top, bottom + 1)

        const sanitize = (val: any): any => {
          if (typeof val === "string" && /^\d+\.0$/.test(val)) {
            return val.replace(/\.0$/, "")
          }
          return val
        }

        const newRows = slicedRows.map((row: any, idx: number) => {
          if (isInitial && idx % 100 === 0) {
            set({ uploadProgress: 55 + Math.round((idx / totalRows) * 35) })
          }
          const sanitizedRow = { ...row }
          Object.keys(sanitizedRow).forEach((key) => {
            if (Array.isArray(sanitizedRow[key])) {
              // 감지된 유효 영역 [left, right] 범위로 슬라이싱 수행
              sanitizedRow[key] = sanitizedRow[key].slice(left, right + 1).map(sanitize)
            } else {
              sanitizedRow[key] = sanitize(sanitizedRow[key])
            }
          })
          
          // 원래 엑셀 시트에서의 절대 행 인덱스(0-based)를 보존하여 주입
          return {
            ...sanitizedRow,
            rowIndex: idx + top
          }
        })

        set((prev) => {
          const nextChunks = new Set(prev.loadedChunks)
          nextChunks.add(chunkIndex)
          return {
            allData: [...prev.allData, ...newRows],
            allOriginalData: [...prev.allOriginalData, ...newRows.map((r: any) => ({ ...r }))],
            totalCount: response.data.totalCount || response.data.data?.totalCount || 0,
            loadedChunks: nextChunks,
          }
        })

        if (isInitial) {
          const { targetColumns, wasInitialFullMapping } = get()
          const mappedColumns = targetColumns.filter((col) => col.frontColumn)
          let isStructureSet = false

          if (mappedColumns.length > 0) {
            const savedHeaderStructure =
              response.data.headerStructure || response.data.data?.headerStructure

            if (savedHeaderStructure) {
              // 백엔드에서 저장된 headerStructure를 함께 보내준 경우 (저장된 정보 우선 사용)
              // top (행 슬라이스 오프셋)을 차감하여 슬라이스된 newRows 기준의 상대 좌표로 변환
              const hBaseRow = Math.max(0, (savedHeaderStructure.headerStartRow ?? 0) - top)
              const hEndRow =
                savedHeaderStructure.headerEndRow !== undefined
                  ? Math.max(0, savedHeaderStructure.headerEndRow - top)
                  : hBaseRow
              const sBaseRow = Math.max(0, (savedHeaderStructure.dataStartRow ?? (hEndRow + 1)) - top)
              const sEndRow =
                savedHeaderStructure.dataEndRow !== undefined
                  ? Math.max(0, savedHeaderStructure.dataEndRow - top)
                  : sBaseRow

              const eBaseRow =
                savedHeaderStructure.etcStartRow !== undefined
                  ? Math.max(0, savedHeaderStructure.etcStartRow - top)
                  : 0
              const eEndRow =
                savedHeaderStructure.etcEndRow !== undefined
                  ? Math.max(0, savedHeaderStructure.etcEndRow - top)
                  : hBaseRow > 0
                    ? hBaseRow - 1
                    : -1

              const detectedHeaderRows = new Set<number>()
              for (let i = hBaseRow; i <= hEndRow; i++) {
                detectedHeaderRows.add(i)
              }
              const hHeight = hEndRow - hBaseRow + 1

              // 하이브리드 매칭: 기본적으로 위치(Index)를 유지하되, 위치가 깨졌다면 이름(frontColumn)으로 폴백(Fallback)
              for (let i = hBaseRow; i <= hEndRow; i++) {
                if (i >= newRows.length) break;
                const rowValues = rowToValues(newRows[i]).map((v) => String(v || "").trim())
                
                targetColumns.forEach((col) => {
                  let resolvedIndex = col.excelColIndex !== null && col.excelColIndex !== undefined 
                                      ? Math.max(0, col.excelColIndex - left) 
                                      : null;

                  if (col.frontColumn) {
                    const expectedName = col.frontColumn.trim()
                    // 1. 해당 위치(resolvedIndex)의 이름이 다르다면, 열이 밀렸는지 의심
                    if (resolvedIndex !== null && rowValues[resolvedIndex] !== expectedName) {
                      const foundIdx = rowValues.indexOf(expectedName);
                      // 2. 다른 곳에서 이름이 발견되었다면 인덱스를 갱신 (위치 깨짐 복구)
                      if (foundIdx !== -1) {
                        resolvedIndex = foundIdx;
                        col.relativeRowIndex = i - hBaseRow;
                      }
                    } 
                    // 3. 처음부터 위치 정보가 없었다면 이름으로 탐색
                    else if (resolvedIndex === null) {
                      const foundIdx = rowValues.indexOf(expectedName);
                      if (foundIdx !== -1) {
                        resolvedIndex = foundIdx;
                        col.relativeRowIndex = i - hBaseRow;
                      }
                    }
                  }
                  col.excelColIndex = resolvedIndex;
                });
              }

              const detectedSampleRows = new Set<number>()
              if (sBaseRow < newRows.length) {
                for (let i = sBaseRow; i <= sEndRow && i < newRows.length; i++) {
                  detectedSampleRows.add(i)
                }
              }

              const detectedEtcRows = new Set<number>()
              if (eEndRow >= eBaseRow) {
                for (let i = eBaseRow; i <= eEndRow && i < newRows.length; i++) {
                  detectedEtcRows.add(i)
                }
              }

              set({
                selectedHeaderRows: detectedHeaderRows,
                headerBaseRow: hBaseRow,
                headerHeight: hHeight,

                selectedSampleRows: detectedSampleRows,
                sampleBaseRow: detectedSampleRows.size > 0 ? sBaseRow : 0,
                recordHeight: detectedSampleRows.size > 0 ? sEndRow - sBaseRow + 1 : 0,

                selectedEtcRows: detectedEtcRows,
                etcBaseRow: detectedEtcRows.size > 0 ? eBaseRow : 0,
                etcHeight: detectedEtcRows.size > 0 ? eEndRow - eBaseRow + 1 : 0,

                isMappingConfirmed: wasInitialFullMapping,
                targetColumns: [...targetColumns],
              })
              isStructureSet = true
            } else {
              // ──────────────────────────────────────────────────────────────
              // [저장된 매핑 없음] 열 구조 반복 기반 자동 감지
              // 핵심: 데이터 행은 "같은 열 위치에 값이 반복"된다
              // ──────────────────────────────────────────────────────────────
              const { dataStartRow, recordHeight: rh } = detectDataArea(newRows)

              const detectedHeaderRows = new Set<number>()
              for (let i = 0; i < dataStartRow; i++) detectedHeaderRows.add(i)
              const hBaseRow = 0
              const hHeight = Math.max(detectedHeaderRows.size, 1)
              const sBaseRow = dataStartRow

              // 헤더 내 frontColumn 이름으로 컬럼 매핑 시도
              for (let i = hBaseRow; i < hBaseRow + hHeight && i < newRows.length; i++) {
                const rowValues = rowToValues(newRows[i]).map((v) => String(v || '').trim())
                targetColumns.forEach((col) => {
                  let resolvedIndex = col.excelColIndex !== null && col.excelColIndex !== undefined ? col.excelColIndex : null
                  if (col.frontColumn) {
                    const expectedName = col.frontColumn.trim()
                    if (resolvedIndex !== null && rowValues[resolvedIndex] !== expectedName) {
                      const foundIdx = rowValues.indexOf(expectedName)
                      if (foundIdx !== -1) { resolvedIndex = foundIdx; col.relativeRowIndex = i - hBaseRow }
                    } else if (resolvedIndex === null) {
                      const foundIdx = rowValues.indexOf(expectedName)
                      if (foundIdx !== -1) { resolvedIndex = foundIdx; col.relativeRowIndex = i - hBaseRow }
                    }
                  }
                  col.excelColIndex = resolvedIndex
                })
              }

              const detectedSampleRows = new Set<number>()
              for (let i = sBaseRow; i < sBaseRow + rh && i < newRows.length; i++) detectedSampleRows.add(i)

              set({
                selectedHeaderRows: detectedHeaderRows,
                headerBaseRow: hBaseRow,
                headerHeight: hHeight,
                selectedSampleRows: detectedSampleRows,
                sampleBaseRow: sBaseRow,
                recordHeight: rh,
                selectedEtcRows: new Set<number>(),
                etcBaseRow: 0,
                etcHeight: 0,
                isMappingConfirmed: wasInitialFullMapping,
                targetColumns: [...targetColumns],
              })
              isStructureSet = true
            }
          }

          // [매핑 정보도 없는 완전 최초] - 동일하게 열 구조 반복 기반 감지 적용
          if (!isStructureSet && newRows.length > 0) {
            const { dataStartRow, recordHeight: rh } = detectDataArea(newRows)

            const defaultHeaderRows = new Set<number>()
            for (let i = 0; i < dataStartRow; i++) defaultHeaderRows.add(i)
            const defaultSampleRows = new Set<number>()
            for (let i = dataStartRow; i < dataStartRow + rh && i < newRows.length; i++) defaultSampleRows.add(i)

            set({
              selectedHeaderRows: defaultHeaderRows,
              headerBaseRow: 0,
              headerHeight: Math.max(defaultHeaderRows.size, 1),
              selectedSampleRows: defaultSampleRows,
              sampleBaseRow: dataStartRow,
              recordHeight: rh,
              selectedEtcRows: new Set<number>(),
              etcBaseRow: 0,
              etcHeight: 0,
            })
            isStructureSet = true
          }

          // 구조가 설정되었다면 자동 구조 분석 수행
          if (isStructureSet) {
            setTimeout(() => {
              get().handleConfirmMapping()
            }, 0)
          }

          set({ uploadProgress: 100 })
          setTimeout(() => {
            set({ isUploading: false, uploadProgress: 0 })
          }, 500)
        }
      }
    } catch (error: any) {
      console.error("Chunk fetch failed", error)
      alert(`업로드 실패: ${error.response?.data?.message || error.message}`)
      set({ isUploading: false, uploadProgress: 0 })
    }
  },

  handleUpload: () => {
    set({
      allData: [],
      allOriginalData: [],
      allOriginalData: [],
      loadedChunks: new Set(),
      page: 1,
      fileKey: null,
      targetColumns: [],
    })
    get().fetchChunk(0, true)
  },

  setValidationErrors: (errors) => set({ validationErrors: errors }),

  handleValidateExcelData: async () => {
    const { fileKey, targetColumns, startColIndex, sampleBaseRow, startRowIndex, fileInfo, headerBaseRow } = get()

    if (!fileKey) {
      alert("파일 키(fileKey)가 없습니다. 엑셀 파일을 다시 업로드해 주세요.")
      return
    }

    const columnMappings = targetColumns
      .filter((col) => col.excelColIndex !== null && col.excelColIndex !== undefined)
      .map((col) => ({
        "col-index": col.excelColIndex! + startColIndex, // 화면상의 잘린 인덱스에 startColIndex를 더해 원본 엑셀 인덱스 복구
        "relative-row": col.relativeRowIndex ?? 0,
        "back-column": col.name,
      }))

    if (columnMappings.length === 0) {
      alert("매핑된 컬럼 정보가 없습니다.")
      return
    }

    // 1. 검증 전 템플릿(매핑 정보) 선 저장
    const templateData = {
      fileName: fileInfo?.name || "unknown",
      structures: {
        headerStartRow: headerBaseRow + startRowIndex,
        headerEndRow: headerBaseRow + (get().headerHeight || 1) - 1 + startRowIndex,
        dataStartRow: sampleBaseRow + startRowIndex,
        dataEndRow: sampleBaseRow + (get().recordHeight || 1) - 1 + startRowIndex,
      },
      targetColumns: targetColumns.map((col) => ({
        ...col,
        excelColIndex: col.excelColIndex !== null && col.excelColIndex !== undefined ? col.excelColIndex + startColIndex : null,
        relativeRowIndex: col.relativeRowIndex ?? 0
      })),
    }

    const savePayload = {
      fileId: fileKey || "",
      modifiedRows: [], 
      mappedData: [],
      templateData: templateData
    }

    try {
      await axios.post("/api/common/save-excel-data-and-template", savePayload)
      console.log("Template saved successfully prior to validation.")
    } catch (err) {
      console.error("Save template failed", err)
      // 템플릿 저장이 실패하더라도 검증은 진행할 수 있도록 에러만 찍고 넘어갑니다.
    }

    // 2. 검증 진행
    const validatePayload = {
      file_key: fileKey || "",
      data_start_row: sampleBaseRow + startRowIndex,
      columnMappings: columnMappings,
    }

    console.log("Validate Excel Payload:", validatePayload)

    axios
      .post("/api/common/validate-excel", validatePayload)
      .then((res) => {
        if (res.data?.data?.success || res.data?.success) {
          get().setValidationErrors([])
          alert("매핑 정보 자동 저장 및 검증이 완료되었습니다! (저장 가능)")
        } else {
          const errors = res.data?.data?.errors || res.data?.errors || []
          get().setValidationErrors(errors)
          console.log("에러 발생 목록:", errors)
          alert("매핑 정보는 저장되었으나, 유효성 검사에 실패한 항목이 있습니다. 빨간색으로 표시된 셀을 확인해주세요.")
        }
      })
      .catch((err) => {
        console.error("Validation failed", err)
        const errMsg = err.response?.data?.message || err.response?.data?.error || err.message;
        alert(`검증 요청 중 오류가 발생했습니다.\n상세: ${errMsg}`)
      })
  },

  handleRowClick: (rowIndex: number) => {
    const { mode } = get()
    if (mode === "HEADER") {
      set((prev) => {
        const next = new Set(prev.selectedHeaderRows)
        if (next.has(rowIndex)) {
          next.delete(rowIndex)
        } else {
          next.add(rowIndex)
        }
        const sorted = Array.from(next).sort((a, b) => a - b)
        const newHeaderBaseRow = sorted.length > 0 ? sorted[0] : prev.headerBaseRow
        const newHeaderHeight = sorted.length > 0 ? sorted[sorted.length - 1] - sorted[0] + 1 : 0

        const nextCells = new Set(prev.selectedHeaderCells)
        nextCells.forEach((id) => {
          if (id.startsWith(`${rowIndex}-`)) nextCells.delete(id)
        })

        return {
          selectedHeaderRows: next,
          headerBaseRow: newHeaderBaseRow,
          headerHeight: newHeaderHeight,
          selectedHeaderCells: nextCells,
        }
      })
    } else if (mode === "DATA") {
      set((prev) => {
        const next = new Set(prev.selectedSampleRows)
        if (next.has(rowIndex)) next.delete(rowIndex)
        else next.add(rowIndex)
        const sorted = Array.from(next).sort((a, b) => a - b)
        const newSampleBaseRow = sorted.length > 0 ? sorted[0] : prev.sampleBaseRow
        const newRecordHeight = sorted.length > 0 ? sorted[sorted.length - 1] - sorted[0] + 1 : 0
        return {
          selectedSampleRows: next,
          sampleBaseRow: newSampleBaseRow,
          recordHeight: newRecordHeight,
        }
      })
    } else if (mode === "ETC") {
      set((prev) => {
        const next = new Set(prev.selectedEtcRows)
        if (next.has(rowIndex)) next.delete(rowIndex)
        else next.add(rowIndex)
        const sorted = Array.from(next).sort((a, b) => a - b)
        const newEtcBaseRow = sorted.length > 0 ? sorted[0] : prev.etcBaseRow
        const newEtcHeight = sorted.length > 0 ? sorted[sorted.length - 1] - sorted[0] + 1 : 0
        return {
          selectedEtcRows: next,
          etcBaseRow: newEtcBaseRow,
          etcHeight: newEtcHeight,
        }
      })
    }
  },

  handleHeaderCellClick: (rowIndex: number, colIndex: number) => {
    const { mode } = get()
    if (mode !== "HEADER") return
    const cellId = `${rowIndex}-${colIndex}`

    set((prev) => {
      const next = new Set(prev.selectedHeaderCells)
      if (next.has(cellId)) {
        next.delete(cellId)
      } else {
        next.add(cellId)
      }
      return { selectedHeaderCells: next }
    })
  },

  handleConfirmMapping: () => {
    const {
      allData,
      selectedHeaderRows,
      selectedSampleRows,
      selectedEtcRows,
      headerBaseRow,
      sampleBaseRow,
      etcBaseRow,
      selectedHeaderCells,
      fileInfo,
    } = get()

    const headerRows = Array.from(selectedHeaderRows).map((idx) => rowToValues(allData[idx]))
    const sampleRows = Array.from(selectedSampleRows).map((idx) => rowToValues(allData[idx]))
    const etcRows = Array.from(selectedEtcRows).map((idx) => rowToValues(allData[idx]))

    if (headerRows.length === 0 || sampleRows.length === 0) {
      alert("헤더 행과 데이터 행을 모두 선택해 주세요.")
      return
    }

    const selectedHeadersValues = new Set(
      Array.from(selectedHeaderCells)
        .map((id) => {
          const [r, c] = id.split("-").map(Number)
          const row = allData[r]
          if (!row) return ""
          return String(rowToValues(row)[c] || "")
        })
        .filter((v) => v !== ""),
    )

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
        if (/^\d+(\.\d+)?$/.test(val.replace(/[\s,]/g, ""))) {
          type = "number"
        } else if (/^\d{3}-\d{3,4}-\d{4}$/.test(val)) {
          type = "phone"
          pattern = "^\\d{3}-\\d{3,4}-\\d{4}$"
        } else if (/^\d{3}-\d{2}-\d{5}$/.test(val)) {
          type = "biz-number"
          pattern = "^\\d{3}-\\d{2}-\\d{5}$"
        }
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
      const mergedList: any[] = []
      const cols = new Set([...headers.map((h) => h.col), ...types.map((t) => t.col)])

      cols.forEach((col) => {
        const colHeaders = headers.filter((h) => h.col === col)
        const colTypes = types.filter((t) => t.col === col)

        if (colTypes.length > 0) {
          colTypes.forEach((typeInfo) => {
            const relativeRow = typeInfo.row - sampleBaseRow
            const matchedHeader = colHeaders.find((h) => h.row - headerBaseRow === relativeRow) ||
              colHeaders[0] || { value: "" }

            const { value, ...restHeader } = matchedHeader
            const merged: any = {
              column: value,
              ...restHeader,
              type: typeInfo.type,
              row: typeInfo.row,
              col: col,
            }
            if (typeInfo.pattern) merged.pattern = typeInfo.pattern
            if (typeInfo.rowspan) merged.rowspan = typeInfo.rowspan
            if (typeInfo.colspan) merged.colspan = typeInfo.colspan
            mergedList.push(merged)
          })
        } else {
          const header = colHeaders.length > 0 ? colHeaders[0] : { value: "" }
          const { value, ...restHeader } = header
          const merged: any = {
            column: value,
            ...restHeader,
            type: "string",
            row: sampleBaseRow,
            col: col,
          }
          mergedList.push(merged)
        }
      })
      return mergedList
    }

    const structuredHeaders = getStructuredData(headersMatrix, headerBaseRow)
    const filteredStructuredHeaders = structuredHeaders.filter(
      (h) => !selectedHeadersValues.has(h.value),
    )
    const structuredData = getStructuredData(dataMatrix, sampleBaseRow)
    const transformStructuredData = mergeHeaderAndType(
      [...filteredStructuredHeaders].sort((a, b) => a.row - b.row || a.col - b.col),
      getStructuredType(dataMatrix, sampleBaseRow).sort((a, b) => a.row - b.row || a.col - b.col),
    )

    console.log("헤더 행 데이터 :", structuredHeaders)
    console.log("데이터 행 데이터:", structuredData)
    console.log("변환된 구조 타입 데이터 (필터링됨):", transformStructuredData)

    const headerHeight = headerRows.length
    const recordHeight = sampleRows.length
    const etcHeight = etcRows.length
    // const flattenedEtc = getStructuredData(etcMatrix, etcBaseRow)

    set({
      headerHeight,
      recordHeight,
      etcHeight,
      mappingResult: {
        headersMatrix,
        dataMatrix,
        etcMatrix,
        headerHeight,
        recordHeight,
        etcHeight,
        // flattenedHeaders: structuredHeaders,
        flattenedData: transformStructuredData,
        // flattenedEtc,
      },
      mode: null,
      isAnalysisDone: true,
    })

    console.log("filename", fileInfo?.name)

    // axios.post("/api/common/analyze-excel-structure", {
    //   fileName: fileInfo?.name,
    // })
  },

  handleCellEdit: (rowIndex: number, colIndex: number, newValue: string) => {
    set((prev) => {
      const list = [...prev.allData]

      // Ensure the row exists. If not, create it and any necessary intermediate rows.
      if (rowIndex >= list.length) {
        const firstRow = list[0] || {}
        const key = Object.keys(firstRow).find((k) => Array.isArray(firstRow[k]))
        const colCount = key ? firstRow[key].length : Object.keys(firstRow).length

        for (let i = list.length; i <= rowIndex; i++) {
          const newRow: any = {}
          if (key) {
            newRow[key] = Array(colCount).fill("")
          } else {
            // If not array-based, try to follow the structure of existing rows
            Object.keys(firstRow).forEach((k) => (newRow[k] = ""))
          }
          list[i] = newRow
        }
      }

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

      // 셀 수정 시 자동 검증 트리거
      setTimeout(() => {
        get().handleConfirmMapping()
      }, 0)

      return {
        allData: list,
        totalCount: Math.max(prev.totalCount, list.length),
      }
    })
  },
}))
