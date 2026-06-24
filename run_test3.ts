import { detectDataArea } from './apps/admin/common/store/useExcelStore';

const rawRows = [
  { "0": "빈칸", "1": "빈칸", "2": "문자", "3": "문자", "4": "문자" },
  { "0": "빈칸", "1": "빈칸", "2": "빈칸", "3": "빈칸", "4": "빈칸" },
  { "0": "빈칸", "1": "빈칸", "2": "빈칸", "3": "빈칸", "4": "빈칸" },
  { "0": "문자", "1": "문자", "2": "문자", "3": "문자", "4": "문자" },
  { "0": "빈칸", "1": "문자", "2": "문자", "3": "문자", "4": "문자" },
  { "0": 123, "1": "문자", "2": 456, "3": 789, "4": 123 },
  { "0": "빈칸", "1": 123, "2": 456, "3": 789, "4": 123 }
].map(r => {
  const newRow: any = {};
  for (const [k, v] of Object.entries(r)) {
    newRow[k] = v === "빈칸" ? "" : v;
  }
  return newRow;
});

// Mock MATCH_RATIO to 0.65
const fs = require('fs');
let code = fs.readFileSync('./apps/admin/common/store/useExcelStore.ts', 'utf8');
code = code.replace(/const MATCH_RATIO = 0.8/g, 'const MATCH_RATIO = 0.65');
code += `\nconsole.log("Detect result:", detectDataArea(${JSON.stringify(rawRows)}));\n`;
fs.writeFileSync('./test_store.ts', code);
