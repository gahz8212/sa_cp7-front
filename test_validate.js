const rowToValues = (row) => {
  if (row === null || row === undefined) return []
  return (Object.values(row).find((v) => Array.isArray(v))) || Object.values(row)
}

const filterRows = (rawRows) => {
  return rawRows.filter((row) => {
    const rowValues = rowToValues(row)
    const totalCols = rowValues.length
    const isAllEmpty = rowValues.every(
      (val) => val === undefined || val === null || String(val).trim() === ""
    )
    if (isAllEmpty) return false

    let emptyCount = 0
    let firstNonEmptyIdx = -1
    rowValues.forEach((val, idx) => {
      const isCellEmpty = val === undefined || val === null || String(val).trim() === ""
      if (isCellEmpty) {
        emptyCount++
      } else {
        if (firstNonEmptyIdx === -1) {
          firstNonEmptyIdx = idx
        }
      }
    })

    const is50PercentOrMoreEmpty = emptyCount >= totalCols * 0.5
    const isRightLeaning = firstNonEmptyIdx >= totalCols * 0.5

    let has3ConsecutiveEmpty = false
    let consecutiveEmptyCount = 0
    for (let i = 0; i < totalCols; i++) {
      const val = rowValues[i]
      const isEmpty = val === undefined || val === null || String(val).trim() === ""
      if (isEmpty) {
        consecutiveEmptyCount++
        if (consecutiveEmptyCount >= 3) {
          has3ConsecutiveEmpty = true
          break
        }
      } else {
        consecutiveEmptyCount = 0
      }
    }

    if (is50PercentOrMoreEmpty && isRightLeaning && has3ConsecutiveEmpty) {
      return false
    }
    return true
  })
}

// 백엔드 validateExcel 로직 시뮬레이터
const simulateBackendValidateExcel = (allRows, dataStartRow, dataEndRow, mappings, metadata) => {
  const dataRowsPerSet = Math.max(1, dataEndRow - dataStartRow + 1)
  const rowMap = {}
  const sortedDataRowIndices = []

  allRows.forEach((row) => {
    if (row.rowIndex >= dataStartRow && row.dataJson) {
      const rowData = row.dataJson
      
      // 필터 적용
      const filtered = filterRows([rowData])
      if (filtered.length === 0) {
        return // 제외
      }

      rowMap[row.rowIndex] = rowData
      sortedDataRowIndices.push(row.rowIndex)
    }
  })

  sortedDataRowIndices.sort((a, b) => a - b)
  console.log("Backend Sorted Data Row Indices:", sortedDataRowIndices)

  const validationTargets = []
  mappings.forEach((mapping) => {
    const meta = metadata.find((m) => m.backColumn === mapping.backColumn)
    if (meta) {
      validationTargets.push({ mapping, meta })
    }
  })

  const errors = []
  const totalDataRows = sortedDataRowIndices.length
  const recordCount = Math.ceil(totalDataRows / dataRowsPerSet)

  for (let recordIdx = 0; recordIdx < recordCount; recordIdx++) {
    const recordRowIndices = []
    for (let r = 0; r < dataRowsPerSet; r++) {
      const listIdx = recordIdx * dataRowsPerSet + r
      if (listIdx < totalDataRows) {
        recordRowIndices.add ? recordRowIndices.push(sortedDataRowIndices[listIdx]) : recordRowIndices.push(sortedDataRowIndices[listIdx])
      }
    }
    if (recordRowIndices.length === 0) continue

    validationTargets.forEach(({ mapping, meta }) => {
      const relativeRow = mapping.relativeRow
      if (relativeRow >= recordRowIndices.length) return

      const targetRowIndex = recordRowIndices[relativeRow]
      const cells = rowMap[targetRowIndex]
      if (!cells) return

      const colIndex = mapping.colIndex
      const val = (colIndex >= 0 && colIndex < cells.length) ? cells[colIndex] : ""

      // 1. 필수값 검증
      if (meta.required && (!val || val.trim() === "")) {
        errors.push({
          rowIndex: targetRowIndex,
          columnCode: mapping.backColumn,
          errorMessage: `${meta.name}은(는) 필수 입력 항목입니다.`,
          invalidValue: val
        })
        return
      }

      if (!val || val.trim() === "") return

      // 2. 타입 검증 (숫자만 대충 예시로)
      if (meta.dataType === "number") {
        if (isNaN(Number(val.replace(/,/g, "").trim()))) {
          errors.push({
            rowIndex: targetRowIndex,
            columnCode: mapping.backColumn,
            errorMessage: `${meta.name}은(는) 숫자 형식이어야 합니다.`,
            invalidValue: val
          })
        }
      }
    })
  }

  return errors
}

// Mock Data
// 엑셀 DB 전체 저장소
const allRows = [
  { rowIndex: 0, dataJson: ["", "", "", "", "기안", "검토", "승인"] }, // 1행 (노이즈)
  { rowIndex: 1, dataJson: ["", "", "", "", "", "", ""] }, // 2행 (빈칸)
  { rowIndex: 2, dataJson: ["이름", "나이", "성별", "연봉", "", "부서", "연락처"] }, // 3행 (헤더 1)
  { rowIndex: 3, dataJson: ["", "", "", "", "", "", ""] }, // 4행 (헤더 2 - 빈칸)
  { rowIndex: 4, dataJson: ["홍길동", "30", "남", "5000", "", "개발팀", "010-111-2222"] }, // 5행 (데이터 1)
  { rowIndex: 5, dataJson: ["", "", "", "6000", "", "서울", "010-333-4444"] }, // 6행 (데이터 2)
  { rowIndex: 6, dataJson: ["이순신", "40", "남", "8000", "", "영업팀", "010-555-6666"] }, // 7행 (데이터 3)
  { rowIndex: 7, dataJson: ["", "", "", "9000", "", "부산", "010-777-8888"] }  // 8행 (데이터 4)
]

// "연봉"은 필수값이고, relativeRow = 1 (2번째 줄)에 매핑되어 있다.
const mappings = [
  { colIndex: 0, relativeRow: 0, backColumn: "NAME" },
  { colIndex: 3, relativeRow: 1, backColumn: "SALARY" }
]

const metadata = [
  { backColumn: "NAME", name: "이름", required: true, dataType: "string" },
  { backColumn: "SALARY", name: "연봉", required: true, dataType: "number" }
]

// 6행(rowIndex = 5)의 연봉을 빈칸으로 만들어보자.
allRows[5].dataJson[3] = "" 

console.log("Simulating validateExcel...")
const errors = simulateBackendValidateExcel(allRows, 4, 5, mappings, metadata)
console.log("Validation Errors:", errors)
