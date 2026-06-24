import { detectDataArea } from './apps/admin/common/store/useExcelStore';

const rawRows = [
  { "0": "빈칸", "1": "빈칸", "2": "문자", "3": "문자", "4": "문자" },
  { "0": "빈칸", "1": "빈칸", "2": "빈칸", "3": "빈칸", "4": "빈칸" },
  { "0": "빈칸", "1": "빈칸", "2": "빈칸", "3": "빈칸", "4": "빈칸" },
  { "0": "문자", "1": "문자", "2": "문자", "3": "문자", "4": "문자" },
  { "0": "빈칸", "1": "문자", "2": "문자", "3": "문자", "4": "문자" },
  { "0": 123, "1": "문자", "2": 456, "3": 789, "4": 123 },
  { "0": "빈칸", "1": 123, "2": 456, "3": 789, "4": 123 }
].map((r, idx) => {
  const newRow: any = {};
  for (const [k, v] of Object.entries(r)) {
    newRow[k] = v === "빈칸" ? "" : v;
  }
  newRow.rowIndex = idx;
  newRow._originalRowIndex = idx;
  return newRow;
});

console.log("Detect result:", detectDataArea(rawRows));
