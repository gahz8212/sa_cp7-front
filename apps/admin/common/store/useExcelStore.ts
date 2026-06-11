import { create } from "zustand"
import axios from "axios"

export type SelectionMode = "HEADER" | "DATA" | "ETC" | null

export const rowToValues = (row: any) =>
  (Object.values(row).find((v) => Array.isArray(v)) as any[]) || Object.values(row)

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
      formData.append("rowNo", "0")
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
        if (isInitial) set({ uploadProgress: 55 })

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
    const { allData, allOriginalData } = get()
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

        const nextCells = new Set(prev.selectedHeaderCells)
        nextCells.forEach((id) => {
          if (id.startsWith(`${rowIndex}-`)) nextCells.delete(id)
        })

        return { 
          selectedHeaderRows: next, 
          headerBaseRow: newHeaderBaseRow,
          selectedHeaderCells: nextCells
        }
      })
    } else if (mode === "DATA") {
      set((prev) => {
        const next = new Set(prev.selectedSampleRows)
        if (next.has(rowIndex)) next.delete(rowIndex)
        else next.add(rowIndex)
        const sorted = Array.from(next).sort((a, b) => a - b)
        return {
          selectedSampleRows: next,
          sampleBaseRow: sorted.length > 0 ? sorted[0] : prev.sampleBaseRow
        }
      })
    } else if (mode === "ETC") {
      set((prev) => {
        const next = new Set(prev.selectedEtcRows)
        if (next.has(rowIndex)) next.delete(rowIndex)
        else next.add(rowIndex)
        const sorted = Array.from(next).sort((a, b) => a - b)
        return {
          selectedEtcRows: next,
          etcBaseRow: sorted.length > 0 ? sorted[0] : prev.etcBaseRow
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
        if (/^\d+(\.\d+)?$/.test(val)) {
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
      const diff = headers.length - types.length

      return headers.map((header, index) => {
        let typeInfo
        if (diff > 0 && index >= types.length) {
          typeInfo = types[index - diff]
        } else {
          typeInfo = types[index]
        }

        const { value, ...rest } = header
        const merged: any = {
          column: value,
          ...rest,
          row: typeInfo?.row ?? sampleBaseRow
        }

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

    const structuredHeaders = getStructuredData(headersMatrix, headerBaseRow)
    const filteredStructuredHeaders = structuredHeaders.filter(
      (h) => !selectedHeadersValues.has(h.value),
    )
    const structuredData = getStructuredData(dataMatrix, sampleBaseRow)
    const transformStructuredData = mergeHeaderAndType(
      [...filteredStructuredHeaders].sort((a, b) => a.row - b.row || a.col - b.col),
      getStructuredType(dataMatrix, sampleBaseRow).sort(
        (a, b) => a.row - b.row || a.col - b.col,
      ),
    )

    console.log("헤더 행 데이터 :", structuredHeaders)
    console.log("데이터 행 데이터:", structuredData)
    console.log("변환된 구조 타입 데이터 (필터링됨):", transformStructuredData)

    const recordHeight = sampleRows.length
    const flattenedEtc = getStructuredData(etcMatrix, etcBaseRow)

    set({
      mappingResult: {
        headersMatrix,
        dataMatrix,
        etcMatrix,
        recordHeight,
        flattenedHeaders: structuredHeaders,
        flattenedData: transformStructuredData,
        flattenedEtc,
      },
      mode: null
    })

    console.log("filename", fileInfo?.name)

    axios.post("/api/common/analyze-excel-structure", {
      fileName: fileInfo?.name,
      flattenedHeaders: structuredHeaders,
      flattenedData: transformStructuredData,
      flattenedEtc,
    })
  },

  handleCellEdit: (rowIndex: number, colIndex: number, newValue: string) => {
    set((prev) => {
      const list = [...prev.allData]
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
      return { allData: list }
    })
  }
}))
