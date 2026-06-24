const fs = require('fs');
let code = fs.readFileSync('apps/admin/common/store/useExcelStore.ts', 'utf8');

code = code.replace(
  /export const filterRows = \(rawRows: any\[\]\): any\[\] => \{[\s\S]*?    return true\n  \}\)\n\}/,
`export const filterRows = (rawRows: any[], absoluteDataStartRow: number = -1): any[] => {
  return rawRows.filter((row) => {
    const rowValues = rowToValues(row)
    const totalCols = rowValues.length

    // 1. 전부 빈칸인지 검사
    const isAllEmpty = rowValues.every(
      (val) => val === undefined || val === null || String(val).trim() === ""
    )
    if (isAllEmpty) return false

    // 2. 데이터 영역(rowIndex >= absoluteDataStartRow)에 대해서만 우측 편향 노이즈 필터링 적용
    // 헤더를 찾는 프로세스(헤더 영역)에서는 이 노이즈 삭제가 동작하지 않도록 방어합니다.
    const originalRowIndex = row._originalRowIndex !== undefined ? row._originalRowIndex : row.rowIndex;
    if (absoluteDataStartRow !== -1 && originalRowIndex >= absoluteDataStartRow) {
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
        return false // 데이터 영역 내의 결제선/노이즈 삭제 대상 행
      }
    }

    return true
  })
}`
);

code = code.replace(
  /const rawRowsWithIndex = rawRows\.map\(\(row: any, idx: number\) => \(\{\n          \.\.\.row,\n          _originalRowIndex: row\.rowIndex !== undefined && row\.rowIndex !== null \? row\.rowIndex : idx\n        \}\)\)\n\n        \/\/ 행 데이터 필터링 헬퍼 함수\n        \/\/ 1\. 전부 빈칸인 행만 삭제 \(기존 우측 편향 노이즈 필터는 2단 헤더 오작동 및 인덱스 꼬임 유발로 제거\)\n        const filteredRows = filterRows\(rawRowsWithIndex\)/,
`const rawRowsWithIndex = rawRows.map((row: any, idx: number) => ({
          ...row,
          _originalRowIndex: row.rowIndex !== undefined && row.rowIndex !== null ? row.rowIndex : idx
        }))

        // 우선 데이터 시작 행을 파악하여 헤더 영역과 데이터 영역을 구분
        let absoluteDataStartRow = -1;
        if (isInitial) {
           const autoDetected = detectDataArea(rawRowsWithIndex);
           absoluteDataStartRow = rawRowsWithIndex[autoDetected.dataStartRow]?._originalRowIndex ?? -1;
        } else {
           absoluteDataStartRow = get().sampleBaseRow;
        }

        // 필터링 적용 (헤더 영역이면 완전 빈 행만 삭제, 데이터 영역이면 노이즈 행 삭제까지 적용)
        const filteredRows = filterRows(rawRowsWithIndex, absoluteDataStartRow)`
);

fs.writeFileSync('apps/admin/common/store/useExcelStore.ts', code);
