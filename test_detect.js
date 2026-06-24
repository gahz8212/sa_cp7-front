const rowToValues = (row) => {
  if (row === null || row === undefined) return []
  return (Object.values(row).find((v) => Array.isArray(v))) || Object.values(row)
}

const getActiveColumnBounds = (rawRows) => {
  if (rawRows.length === 0) return { left: 0, right: 0 }
  const firstRowValues = rowToValues(rawRows[0])
  const maxCols = firstRowValues.length
  let left = 0
  let right = maxCols - 1
  for (let c = 0; c < maxCols; c++) {
    const isAllEmpty = rawRows.every((row) => {
      const rowValues = rowToValues(row)
      const val = rowValues[c]
      return val === undefined || val === null || String(val).trim() === ""
    })
    if (isAllEmpty) left++
    else break
  }
  for (let c = maxCols - 1; c >= left; c--) {
    const isAllEmpty = rawRows.every((row) => {
      const rowValues = rowToValues(row)
      const val = rowValues[c]
      return val === undefined || val === null || String(val).trim() === ""
    })
    if (isAllEmpty) right--
    else break
  }
  return { left, right }
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

const detectDataArea = (rows) => {
  const SCAN_LIMIT        = Math.min(rows.length, 10)
  const MATCH_RATIO       = 0.8
  const MAX_RECORD_HEIGHT = 4

  const totalCols = Math.max(
    1,
    ...rows.slice(0, Math.min(5, rows.length)).map((r) => rowToValues(r).length)
  )

  const getCellType = (val) => {
    const trimmed = String(val).trim()
    if (!trimmed) return 'empty'
    const cleaned = trimmed.replace(/[-,]/g, '').replace(/%$/, '')
    if (cleaned !== '' && !isNaN(Number(cleaned))) return 'number'
    return 'string'
  }

  const getSignature = (row) =>
    rowToValues(row).map((v) => getCellType(v))

  const isNoiseRow = (row) => {
    const values = rowToValues(row).map((v) => String(v ?? '').trim())
    const nonEmptyIndices = values
      .map((v, i) => ({ i, v }))
      .filter(({ v }) => v !== '')
      .map(({ i }) => i)

    if (nonEmptyIndices.length === 0) return true

    const firstNonEmpty = nonEmptyIndices[0]
    const nonEmptyCount = nonEmptyIndices.length

    if (firstNonEmpty >= totalCols * 0.5) return true

    if (nonEmptyCount <= Math.max(2, Math.floor(totalCols * 0.25)) && firstNonEmpty < 3) return true

    return false
  }

  const isStringOnlyRow = (sig) =>
    sig.some((t) => t === 'string') && sig.every((t) => t === 'string' || t === 'empty')

  const sigMatch = (a, b) => {
    const len = Math.max(a.length, b.length)
    if (len === 0) return true

    let structureMatched = 0
    let typeMatched = 0
    let compared = 0

    for (let i = 0; i < len; i++) {
      const ta = a[i] ?? 'empty'
      const tb = b[i] ?? 'empty'

      if (ta === 'empty' && tb === 'empty') continue

      compared++
      
      const hasValueA = ta !== 'empty'
      const hasValueB = tb !== 'empty'

      if (hasValueA === hasValueB) {
        structureMatched++
      }

      if (hasValueA && hasValueB && ta === tb) {
        typeMatched++
      }
    }

    if (compared === 0) return true

    const structureRatio = structureMatched / compared
    const typeRatio = typeMatched / compared
    const avgRatio = (structureRatio + typeRatio) / 2

    return avgRatio >= MATCH_RATIO
  }

  const sigs = rows.slice(0, SCAN_LIMIT).map(getSignature)

  console.log("=== [detectDataArea] Scan Start ===")
  sigs.forEach((sig, idx) => {
    console.log(`Row ${idx} (Original index: ${rows[idx]?.rowIndex}):`, sig, "isStringOnly:", isStringOnlyRow(sig))
  })

  let scanStart = 0
  while (scanStart < SCAN_LIMIT && isNoiseRow(rows[scanStart])) {
    scanStart++
  }
  console.log("scanStart index after noise skipping:", scanStart)

  if (scanStart >= SCAN_LIMIT) {
    const colCount = Math.max(1, rowToValues(rows[0] ?? {}).length)
    return {
      dataStartRow: 0,
      recordHeight: 1,
      syntheticHeaderNames: Array.from({ length: colCount }, (_, i) => `컬럼${i + 1}`),
    }
  }

  let dataStartRow = scanStart + 1
  let recordHeight = 1
  let foundDataPattern = false

  const startScanIdx = Math.min(scanStart + 1, SCAN_LIMIT - 1)

  const hasNonStringOnlyRow = sigs.slice(startScanIdx, SCAN_LIMIT).some((sig) => !isStringOnlyRow(sig))
  console.log("hasNonStringOnlyRow inside limit:", hasNonStringOnlyRow)

  for (let i = startScanIdx; i < SCAN_LIMIT - 1; i++) {
    if (hasNonStringOnlyRow && isStringOnlyRow(sigs[i])) {
      console.log(`Row ${i} is string-only and hasNonStringOnlyRow is true, skipping from data start candidate.`)
      continue
    }

    for (let k = 1; k <= MAX_RECORD_HEIGHT; k++) {
      if (i + k >= SCAN_LIMIT) break
      
      if (sigMatch(sigs[i], sigs[i + k])) {
        let allMatched = true;

        for (let offset = 1; offset < k; offset++) {
          if (i + k + offset >= SCAN_LIMIT) break;
          if (!sigMatch(sigs[i + offset], sigs[i + k + offset])) {
            allMatched = false;
            break;
          }
        }

        if (allMatched && i + 2 * k < SCAN_LIMIT) {
          for (let offset = 0; offset < k; offset++) {
            if (i + 2 * k + offset >= SCAN_LIMIT) break;
            if (!sigMatch(sigs[i + offset], sigs[i + 2 * k + offset])) {
              allMatched = false;
              break;
            }
          }
        }

        if (allMatched) {
          dataStartRow = i
          recordHeight = k
          foundDataPattern = true
          console.log(`[detectDataArea] Found matching pattern starting at row ${i} with recordHeight ${k}`)
          break
        }
      }
    }
    if (foundDataPattern) break
  }

  if (!foundDataPattern) {
    dataStartRow = Math.min(scanStart + 2, rows.length - 1)
    recordHeight = 1
    console.log(`[detectDataArea] No pattern found. Fallback dataStartRow to ${dataStartRow}`)
  }

  if (dataStartRow === scanStart) {
    const colCount = rowToValues(rows[scanStart]).length
    const syntheticHeaderNames = Array.from({ length: colCount }, (_, i) => `컬럼${i + 1}`)
    return { dataStartRow, recordHeight, syntheticHeaderNames }
  }

  return { dataStartRow, recordHeight, syntheticHeaderNames: null }
}

const rawRows = [
  { "data": ["", "", "", "", "기안", "검토", "승인"], "_originalRowIndex": 0 },
  { "data": ["", "", "", "", "", "", ""], "_originalRowIndex": 1 },
  { "data": ["이름", "나이", "성별", "직급", "", "부서", "입사일"], "_originalRowIndex": 2 },
  { "data": ["", "", "", "연봉", "", "주소", "연락처"], "_originalRowIndex": 3 },
  { "data": ["홍길동", "30", "남", "대리", "", "개발팀", "2024-01-01"], "_originalRowIndex": 4 },
  { "data": ["", "", "", "50000000", "", "서울", "010-1234-5678"], "_originalRowIndex": 5 },
  { "data": ["이순신", "40", "남", "부장", "", "영업팀", "2023-05-10"], "_originalRowIndex": 6 },
  { "data": ["", "", "", "80000000", "", "부산", "010-9876-5432"], "_originalRowIndex": 7 }
]

console.log("Raw count:", rawRows.length)
const filtered = filterRows(rawRows)
console.log("Filtered count:", filtered.length)
filtered.forEach((r, idx) => {
  console.log(`Filtered Row ${idx} (Original index: ${r._originalRowIndex}):`, r.data)
})

const result = detectDataArea(filtered)
console.log("Result:", result)
