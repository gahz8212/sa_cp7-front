const rowToValues = (row) => {
  if (row === null || row === undefined) return []
  return (Object.values(row).find((v) => Array.isArray(v))) || Object.values(row)
}

const allData = [
  {"0": "1", "1": "OO자재", "2": "123123123", "3": "김OO", "4": "철근", "5": "신한", "rowIndex": 0},
  {"3": "123", "4": "23", "5": "000", "rowIndex": 1}
]

const targetColumns = [
  { excelColIndex: 0 },
  { excelColIndex: 5 }
]

const sampleBaseRow = 0;

let lastContentRowIndex = -1;
for (let i = allData.length - 1; i >= sampleBaseRow; i--) {
  const rowValues = rowToValues(allData[i])
  console.log(`row ${i} values length:`, rowValues.length, rowValues)
  const hasDataInMappedCols = targetColumns.some((col) => {
    if (col.excelColIndex !== null && col.excelColIndex !== undefined) {
      const val = rowValues[col.excelColIndex]
      console.log(`col ${col.excelColIndex} val:`, val)
      return val !== null && val !== undefined && String(val).trim() !== ""
    }
    return false
  })
  if (hasDataInMappedCols) {
    lastContentRowIndex = i;
    break;
  }
}

console.log("lastContentRowIndex:", lastContentRowIndex)

