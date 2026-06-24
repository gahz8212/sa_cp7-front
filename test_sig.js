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

const row1 = ["1", "OO자재", "123123123", "김OO", "철근", "신한"]
const row2 = ["", "", "", "123", "23", "000"]
const row3 = ["2", "XX자재", "123123000", "박XX", "타일", "국민"]

const sig1 = row1.map(getCellType)
const sig2 = row2.map(getCellType)
const sig3 = row3.map(getCellType)

console.log("sig1", sig1)
console.log("sig2", sig2)
console.log("sig3", sig3)

console.log("1 vs 2:", sigMatch(sig1, sig2))
console.log("1 vs 3:", sigMatch(sig1, sig3))
