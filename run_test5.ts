import { detectDataArea } from './apps/admin/common/store/useExcelStore';

const rawRows = [
  { "0": "", "1": "문자", "2": "문자", "3": "문자" },
  { "0": "", "1": "", "2": "", "3": "" },
  { "0": "", "1": "", "2": "", "3": "" },
  { "0": "문자", "1": "문자", "2": "문자", "3": "문자" },
  { "0": "", "1": "문자", "2": "문자", "3": "문자" },
  { "0": 123, "1": "문자", "2": 456, "3": 789 },
  { "0": "", "1": 123, "2": 456, "3": 789 }
].map((r, idx) => {
  const newRow: any = {};
  for (const [k, v] of Object.entries(r)) {
    newRow[k] = v;
  }
  newRow.rowIndex = idx;
  newRow._originalRowIndex = idx;
  return newRow;
});

console.log("Detect result:", detectDataArea(rawRows));
