import { create } from "zustand"
import axios from "axios"

export type SelectionMode = "HEADER" | "DATA" | "ETC" | null

export const rowToValues = (row: any) =>
  (Object.values(row).find((v) => Array.isArray(v)) as any[]) || Object.values(row)

interface TargetColumn {
  backColumn: string
  name: string
  description: string
  required: boolean
  frontColumn?: string | null // 매핑된 엑셀 컬럼명
  excelColIndex?: number | null // 매핑된 엑셀 컬럼 인덱스
  relativeRowIndex?: number | null // 매핑된 엑셀 상대 행 인덱스 (헤더 내 위치)
}

interface ExcelState {
  file: File | null
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
}

interface ExcelActions {
  setFile: (file: File | null) => void
  setPage: (page: number) => void
  setMode: (mode: SelectionMode) => void
  resetSelection: () => void
  resetAll: () => void

  fetchChunk: (chunkIndex: number, isInitial?: boolean) => Promise<void>
  handleUpload: () => void
  handleExtractModifiedData: () => void

  handleRowClick: (rowIndex: number) => void
  handleHeaderCellClick: (rowIndex: number, colIndex: number) => void
  handleConfirmMapping: () => void
  handleCellEdit: (rowIndex: number, colIndex: number, newValue: string) => void
  setMappingResult: (result: any) => void
  setTargetColumns: (columns: TargetColumn[]) => void
  updateColumnMapping: (backColumn: string, frontColumn: string | null, colIndex: number | null, relativeRowIndex?: number | null) => void
  confirmMappingCompletion: () => void
  setIsMappingConfirmed: (isConfirmed: boolean) => void
}

export const useExcelStore = create<ExcelState & ExcelActions>((set, get) => ({
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
  // 백엔드에서 받아온 매핑 대상 컬럼
  targetColumns: [],
  isMappingConfirmed: false,
  isAnalysisDone: false,
  wasInitialFullMapping: false,

  confirmMappingCompletion: () => {
    const allMapped = get().targetColumns.every((col) => col.frontColumn)
    if (allMapped) {
      set({ isMappingConfirmed: true })
    }
  },

  setIsMappingConfirmed: (isMappingConfirmed) => {
    if (isMappingConfirmed) {
      const allMapped = get().targetColumns.every((col) => col.frontColumn)
      if (!allMapped) return
    }
    set({ isMappingConfirmed })
  },

  setTargetColumns: (columns) => set({ targetColumns: columns }),
  
  updateColumnMapping: (backColumn, frontColumn, colIndex, relativeRowIndex) => set((prev) => {
    const nextTargetColumns = prev.targetColumns.map((col) => {
      // 1. 해당 시스템 컬럼의 매핑 정보를 업데이트
      if (col.backColumn === backColumn) {
        return { ...col, frontColumn, excelColIndex: colIndex, relativeRowIndex }
      }
      // 2. 다른 시스템 컬럼이 이미 이 위치(행, 열)에 매핑되어 있었다면 해제 (1:1 매핑 유지)
      if (frontColumn && col.frontColumn === frontColumn && col.excelColIndex === colIndex && col.relativeRowIndex === relativeRowIndex) {
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
      })
    } else {
      get().resetAll()
    }
  },

  setPage: (page) => set({ page }),
  setMode: (mode) => set({ mode }),
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
    })
  },

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
      formData.append("size", "1000")

      const response = await axios.post("/api/common/upload-excel", formData, {
        onUploadProgress: (progressEvent) => {
          if (isInitial && progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 45) / progressEvent.total)
            set({ uploadProgress: 5 + percentCompleted }) // 5% ~ 50%
          }
        }
      })
      console.log("Chunk response:", response.data)
      if (response.data) {
        if (isInitial) {
           set({ uploadProgress: 55 })
           // 첫 청크 로드 시 targetColumns가 서버 응답에 있다면 상태에 저장합니다.
           const backendTargetColumns = response.data.targetColumns || response.data.data?.targetColumns
           if (backendTargetColumns) {
               // 모든 frontColumn이 null이 아닌지 확인 (수정 모드 노출 여부 결정)
               const allMapped = backendTargetColumns.length > 0 && backendTargetColumns.every((col: any) => col.frontColumn !== null && col.frontColumn !== undefined)
               
               // 프론트에서 사용할 수 있도록 frontColumn, excelColIndex를 명시적으로 초기화 (이미 있으면 유지)
               const initializedColumns = backendTargetColumns.map((col: any) => ({
                 ...col,
                 frontColumn: col.frontColumn || null,
                 excelColIndex: col.excelColIndex ?? null
               }))
               set({ targetColumns: initializedColumns, wasInitialFullMapping: allMapped, isMappingConfirmed: allMapped })

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

        const sanitize = (val: any): any => {
          if (typeof val === "string" && /^\d+\.0$/.test(val)) {
            return val.replace(/\.0$/, "")
          }
          return val
        }

        const newRows = rawRows.map((row: any, idx: number) => {
          if (isInitial && idx % 100 === 0) {
            set({ uploadProgress: 55 + Math.round((idx / totalRows) * 35) })
          }
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

        set((prev) => {
          const nextChunks = new Set(prev.loadedChunks)
          nextChunks.add(chunkIndex)
          return {
            allData: [...prev.allData, ...newRows],
            allOriginalData: [...prev.allOriginalData, ...newRows.map((r: any) => ({ ...r }))],
            totalCount: response.data.totalCount || response.data.data?.totalCount || 0,
            loadedChunks: nextChunks
          }
        })

        if (isInitial) {
          const { targetColumns, wasInitialFullMapping } = get()
          const mappedColumns = targetColumns.filter(col => col.frontColumn)
          
          if (mappedColumns.length > 0) {
             const savedHeaderStructure = response.data.headerStructure || response.data.data?.headerStructure;

             if (savedHeaderStructure) {
                 // 백엔드에서 저장된 headerStructure를 함께 보내준 경우 (저장된 정보 우선 사용)
                 const hBaseRow = savedHeaderStructure.headerStartRow || 0;
                 const hEndRow = savedHeaderStructure.headerEndRow !== undefined ? savedHeaderStructure.headerEndRow : hBaseRow;
                 const sBaseRow = savedHeaderStructure.dataStartRow || (hEndRow + 1);
                 const sEndRow = savedHeaderStructure.dataEndRow !== undefined ? savedHeaderStructure.dataEndRow : sBaseRow;
                 
                 const eBaseRow = savedHeaderStructure.etcStartRow !== undefined ? savedHeaderStructure.etcStartRow : 0;
                 const eEndRow = savedHeaderStructure.etcEndRow !== undefined ? savedHeaderStructure.etcEndRow : (hBaseRow > 0 ? hBaseRow - 1 : -1);

                 const detectedHeaderRows = new Set<number>();
                 for (let i = hBaseRow; i <= hEndRow; i++) {
                     detectedHeaderRows.add(i);
                 }
                 const hHeight = hEndRow - hBaseRow + 1;

                 // 확정된 헤더 영역 내에서 excelColIndex 매칭
                 for (let i = hBaseRow; i <= hEndRow && i < newRows.length; i++) {
                     const rowValues = rowToValues(newRows[i]).map(v => String(v || "").trim());
                     targetColumns.forEach(col => {
                         if (col.frontColumn) {
                             const colIdx = rowValues.indexOf(col.frontColumn.trim());
                             if (colIdx !== -1) {
                                 col.excelColIndex = colIdx;
                                 col.relativeRowIndex = i - hBaseRow;
                             }
                         }
                     });
                 }

                 const detectedSampleRows = new Set<number>();
                 if (sBaseRow < newRows.length) {
                     for (let i = sBaseRow; i <= sEndRow && i < newRows.length; i++) {
                         detectedSampleRows.add(i);
                     }
                 }

                 const detectedEtcRows = new Set<number>();
                 if (eEndRow >= eBaseRow) {
                     for (let i = eBaseRow; i <= eEndRow && i < newRows.length; i++) {
                         detectedEtcRows.add(i);
                     }
                 }

                 set({
                     selectedHeaderRows: detectedHeaderRows,
                     headerBaseRow: hBaseRow,
                     headerHeight: hHeight,

                     selectedSampleRows: detectedSampleRows,
                     sampleBaseRow: detectedSampleRows.size > 0 ? sBaseRow : 0,
                     recordHeight: detectedSampleRows.size > 0 ? (sEndRow - sBaseRow + 1) : 0,

                     selectedEtcRows: detectedEtcRows,
                     etcBaseRow: detectedEtcRows.size > 0 ? eBaseRow : 0,
                     etcHeight: detectedEtcRows.size > 0 ? (eEndRow - eBaseRow + 1) : 0,

                     isMappingConfirmed: wasInitialFullMapping,
                     targetColumns: [...targetColumns]
                 });
             } else {
                 const detectedHeaderRows = new Set<number>();

                 // 1. 먼저 상위 20행을 스캔하여 '대표 헤더 행'을 찾고 영역을 추정함
                 // (이 작업은 headerBaseRow와 headerHeight를 확정하기 위함)
                 for (let i = 0; i < Math.min(newRows.length, 20); i++) {
                    const rowValues = rowToValues(newRows[i]).map(v => String(v || "").trim());
                    targetColumns.forEach(col => {
                        if (col.frontColumn && rowValues.includes(col.frontColumn.trim())) {
                            detectedHeaderRows.add(i);
                        }
                    });
                 }

                 if (detectedHeaderRows.size > 0) {
                    const sortedRows = Array.from(detectedHeaderRows).sort((a, b) => a - b);
                    const hBaseRow = sortedRows[0];
                    const hHeight = sortedRows.length; // 연속된 행이라고 가정 (또는 마지막-처음 + 1)

                    // 2. 확정된 헤더 영역 내에서 각 컬럼의 excelColIndex를 정확히 매칭
                    for (let i = hBaseRow; i < hBaseRow + hHeight; i++) {
                        const rowValues = rowToValues(newRows[i]).map(v => String(v || "").trim());
                        targetColumns.forEach(col => {
                            if (col.frontColumn) {
                                const colIdx = rowValues.indexOf(col.frontColumn.trim());
                                if (colIdx !== -1) {
                                    col.excelColIndex = colIdx;
                                    col.relativeRowIndex = i - hBaseRow;
                                }
                            }
                        });
                    }

                    // 3. 데이터 영역 자동 추정 (헤더 바로 다음 행부터 데이터라고 가정)
                    const detectedSampleRows = new Set<number>();
                    const sBaseRow = hBaseRow + hHeight;
                    if (sBaseRow < newRows.length) {
                        detectedSampleRows.add(sBaseRow);
                    }

                    // 4. 기타 영역 자동 추정 (헤더 이전의 행들을 기타 영역으로 가정)
                    const detectedEtcRows = new Set<number>();
                    for (let i = 0; i < hBaseRow; i++) {
                        detectedEtcRows.add(i);
                    }

                    set({
                        selectedHeaderRows: detectedHeaderRows,
                        headerBaseRow: hBaseRow,
                        headerHeight: hHeight,

                        selectedSampleRows: detectedSampleRows,
                        sampleBaseRow: detectedSampleRows.size > 0 ? sBaseRow : 0,
                        recordHeight: detectedSampleRows.size > 0 ? 1 : 0,

                        selectedEtcRows: detectedEtcRows,
                        etcBaseRow: detectedEtcRows.size > 0 ? 0 : 0,
                        etcHeight: detectedEtcRows.size > 0 ? hBaseRow : 0,

                        isMappingConfirmed: wasInitialFullMapping, // 모든 컬럼이 매핑된 경우에만 확정 상태로 시작
                        targetColumns: [...targetColumns]
                    });
                 }
             }
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
      loadedChunks: new Set(),
      page: 1,
    })
    get().fetchChunk(0, true)
  },

  handleExtractModifiedData: () => {
    const { 
      allData, 
      allOriginalData, 
      targetColumns, 
      selectedHeaderRows, 
      selectedSampleRows,
      selectedEtcRows,
      headerBaseRow, 
      sampleBaseRow,
      etcBaseRow,
      recordHeight,
      mappingResult,
      fileInfo
    } = get()
    
    if (allData.length === 0) return

    // 1. 수정된 데이터 추출
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

    // 2. 템플릿 데이터 생성
    const headerRowIndices = Array.from(selectedHeaderRows).sort((a, b) => a - b)
    const headerEndRow = headerRowIndices.length > 0 ? headerRowIndices[headerRowIndices.length - 1] : headerBaseRow
    
    const sampleRowIndices = Array.from(selectedSampleRows).sort((a, b) => a - b)
    const dataEndRow = sampleRowIndices.length > 0 ? sampleRowIndices[sampleRowIndices.length - 1] : sampleBaseRow

    const etcRowIndices = Array.from(selectedEtcRows).sort((a, b) => a - b)
    const etcEndRow = etcRowIndices.length > 0 ? etcRowIndices[etcRowIndices.length - 1] : etcBaseRow

    // 3. 실제 입력할 데이터 배열 생성 (데이터 영역의 모든 레코드 대상)
    // recordHeight가 2라면, 2행이 하나의 데이터 세트임
    const mappedData: any[] = [];
    for (let i = sampleBaseRow; i < allData.length; i += recordHeight || 1) {
      const recordRows = allData.slice(i, i + (recordHeight || 1));
      
      const recordData = targetColumns
        .filter(col => col.frontColumn && col.excelColIndex !== null && col.excelColIndex !== undefined)
        .map(col => {
          // relativeRowIndex가 지정되어 있다면 해당 행에서 값을 가져오고, 없으면 첫 행에서 가져옴
          const targetRow = recordRows[recordHeight === 1 ? 0 : (col.relativeRowIndex || 0)];
          const rowValues = targetRow ? rowToValues(targetRow) : [];
          const cellValue = String(rowValues[col.excelColIndex!] || "").trim();
          
          return {
            "front-column": col.frontColumn,
            "back-column": col.backColumn,
            "value": cellValue
          };
        })
        .filter(item => item.value !== ""); // value가 빈 문자열이면 제외

      if (recordData.length > 0) {
        mappedData.push(recordData);
      }
    }

    // 선택된 헤더 행(첫 번째 줄)의 모든 컬럼 값을 가져옵니다.
    const originalHeaderColumns = headerRowIndices.length > 0 
      ? rowToValues(allData[headerRowIndices[0]]).map(v => String(v || "").trim())
      : []

    // 백엔드 요청을 위해 userMapping 형식으로 변환 (백엔드 API 스펙 유지를 위해 복구)
    const userMapping = targetColumns
      .filter(col => col.frontColumn)
      .map(col => ({
        "front-column": col.frontColumn,
        "back-column": col.backColumn // 시스템 컬럼 ID 매핑
      }))

    const templateData = {
      // targetSysType: mappingResult?.targetSysType || "UNKNOWN",
      fileName: fileInfo?.name,
      structures: {
        headerStartRow: headerBaseRow,
        headerEndRow: headerEndRow,
        dataStartRow: sampleBaseRow,
        dataEndRow: dataEndRow,
        etcStartRow: etcBaseRow,
        etcEndRow: etcEndRow,
        // originalHeaderColumns: originalHeaderColumns
      },
      // userMapping: userMapping,
      targetColumns: targetColumns // 통합된 전체 데이터 전송
    }

    console.log("Modified Data:", changes)
    console.log("Generated Template Data:", templateData)
    console.log("To db of BackEnd (Actual values):", mappedData)

    if (changes.length > 0 || userMapping.length > 0 || mappedData.length > 0) {
      
      axios.post("/api/common/save-excel-data-and-template", { 
        modifiedRows: changes,
        templateData: templateData,
        mappedData: mappedData // 실제 매핑된 데이터 전송
      }).then(() => {
        alert("데이터와 매핑 템플릿이 성공적으로 저장되었습니다.")
      }).catch(err => {
        console.error("Save failed", err)
        alert("저장 중 오류가 발생했습니다.")
      })
    } else {
      alert("수정된 데이터나 매핑 정보가 없습니다.")
    }
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
        const newHeaderHeight = sorted.length > 0 ? (sorted[sorted.length - 1] - sorted[0] + 1) : 0

        const nextCells = new Set(prev.selectedHeaderCells)
        nextCells.forEach((id) => {
          if (id.startsWith(`${rowIndex}-`)) nextCells.delete(id)
        })

        return { 
          selectedHeaderRows: next, 
          headerBaseRow: newHeaderBaseRow,
          headerHeight: newHeaderHeight,
          selectedHeaderCells: nextCells
        }
      })
    } else if (mode === "DATA") {
      set((prev) => {
        const next = new Set(prev.selectedSampleRows)
        if (next.has(rowIndex)) next.delete(rowIndex)
        else next.add(rowIndex)
        const sorted = Array.from(next).sort((a, b) => a - b)
        const newSampleBaseRow = sorted.length > 0 ? sorted[0] : prev.sampleBaseRow
        const newRecordHeight = sorted.length > 0 ? (sorted[sorted.length - 1] - sorted[0] + 1) : 0
        return {
          selectedSampleRows: next,
          sampleBaseRow: newSampleBaseRow,
          recordHeight: newRecordHeight
        }
      })
    } else if (mode === "ETC") {
      set((prev) => {
        const next = new Set(prev.selectedEtcRows)
        if (next.has(rowIndex)) next.delete(rowIndex)
        else next.add(rowIndex)
        const sorted = Array.from(next).sort((a, b) => a - b)
        const newEtcBaseRow = sorted.length > 0 ? sorted[0] : prev.etcBaseRow
        const newEtcHeight = sorted.length > 0 ? (sorted[sorted.length - 1] - sorted[0] + 1) : 0
        return {
          selectedEtcRows: next,
          etcBaseRow: newEtcBaseRow,
          etcHeight: newEtcHeight
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
      fileInfo
    } = get()

    const headerRows = Array.from(selectedHeaderRows).map((idx) => rowToValues(allData[idx]))
    const sampleRows = Array.from(selectedSampleRows).map((idx) => rowToValues(allData[idx]))
    const etcRows = Array.from(selectedEtcRows).map((idx) => rowToValues(allData[idx]))

    if (headerRows.length === 0 || sampleRows.length === 0) {
      alert("헤더 행과 데이터 행을 모두 선택해 주세요.")
      return
    }

    const selectedHeadersValues = new Set(
      Array.from(selectedHeaderCells).map((id) => {
        const [r, c] = id.split("-").map(Number)
        const row = allData[r]
        if (!row) return ""
        return String(rowToValues(row)[c] || "")
      }).filter((v) => v !== "")
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
        if (/^\d+(\.\d+)?$/.test(val.replace(/,/g, ""))) {  
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
      const mergedList: any[] = [];
      const cols = new Set([...headers.map(h => h.col), ...types.map(t => t.col)]);
      
      cols.forEach(col => {
        const colHeaders = headers.filter(h => h.col === col);
        const colTypes = types.filter(t => t.col === col);
        
        const header = colHeaders.length > 0 ? colHeaders[0] : { value: "" };
        const { value, ...restHeader } = header;

        if (colTypes.length > 0) {
           colTypes.forEach(typeInfo => {
             const merged: any = {
                column: value,
                ...restHeader,
                type: typeInfo.type,
                row: typeInfo.row,
                col: col,
             };
             if (typeInfo.pattern) merged.pattern = typeInfo.pattern;
             if (typeInfo.rowspan) merged.rowspan = typeInfo.rowspan;
             if (typeInfo.colspan) merged.colspan = typeInfo.colspan;
             mergedList.push(merged);
           });
        } else {
           const merged: any = {
              column: value,
              ...restHeader,
              type: "string",
              row: sampleBaseRow,
              col: col
           };
           mergedList.push(merged);
        }
      });
      return mergedList;
    }

    const structuredHeaders = getStructuredData(headersMatrix, headerBaseRow)
    const filteredStructuredHeaders = structuredHeaders.filter(
      (h) => !selectedHeadersValues.has(h.value),
    )
    // const structuredData = getStructuredData(dataMatrix, sampleBaseRow)
    const transformStructuredData = mergeHeaderAndType(
      [...filteredStructuredHeaders].sort((a, b) => a.row - b.row || a.col - b.col),
      getStructuredType(dataMatrix, sampleBaseRow).sort(
        (a, b) => a.row - b.row || a.col - b.col,
      ),
    )

    console.log("헤더 행 데이터 :", structuredHeaders)
    // console.log("데이터 행 데이터:", structuredData)
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
      isAnalysisDone: true
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
