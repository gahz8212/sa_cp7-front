const MATCH_RATIO = 0.9;
const getCellType = (val) => {
  const trimmed = String(val).trim()
  if (!trimmed) return 'empty'
  const cleaned = trimmed.replace(/[-,]/g, '').replace(/%$/, '')
  if (cleaned !== '' && !isNaN(Number(cleaned))) return 'number'
  return 'string'
}

const sigMatch = (a, b) => {
  const len = Math.max(a.length, b.length)
  let matched = 0
  let compared = 0
  for (let i = 0; i < len; i++) {
    const ta = a[i] ?? 'empty'
    const tb = b[i] ?? 'empty'
    if (ta === 'empty' || tb === 'empty') continue
    compared++
    if (ta === tb) matched++
  }
  if (compared === 0) return true
  return matched / compared >= MATCH_RATIO
}

const rowToValues = (row) => {
  if (row === null || row === undefined) return []
  return (Object.values(row).find((v) => Array.isArray(v))) || Object.values(row)
}

const row1 = { "col1": "1", "col2": "OO자재", "col3": "123123123", "col4": "김OO", "col5": "철근", "col6": "신한" }
const row2 = { "col4": "123", "col5": "23", "col6": "000" }
const row3 = { "col1": "2", "col2": "XX자재", "col3": "123123000", "col4": "박XX", "col5": "타일", "col6": "국민" }

const sig1 = rowToValues(row1).map(getCellType)
const sig2 = rowToValues(row2).map(getCellType)
const sig3 = rowToValues(row3).map(getCellType)

console.log("sig1", sig1)
console.log("sig2", sig2)
console.log("sig3", sig3)

console.log("1 vs 2:", sigMatch(sig1, sig2))
console.log("1 vs 3:", sigMatch(sig1, sig3))
