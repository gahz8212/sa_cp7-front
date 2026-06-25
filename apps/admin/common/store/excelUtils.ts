export type CellType = 'number' | 'string' | 'empty';
export type Signature = CellType[];

export type RowCategory = 'EMPTY' | 'TITLE' | 'APPROVAL' | 'HEADER_CANDIDATE' | 'UNKNOWN';

// ── 1. 셀 및 행 기본 유틸리티 ───────────────────────────────────────────

export const rowToValues = (row: any): any[] => {
  if (row === null || row === undefined) return [];
  
  // 배열이 직접 들어있는 경우
  const arrayValue = Object.values(row).find((v) => Array.isArray(v)) as any[];
  if (arrayValue) return arrayValue;

  // rowIndex, _originalRowIndex 등의 내부 메타데이터 필드를 제외하고 순수 데이터 값만 추출
  return Object.keys(row)
    .filter((k) => k !== 'rowIndex' && k !== '_originalRowIndex')
    .map((k) => row[k]);
};

export const getCellType = (val: any): CellType => {
  const str = String(val ?? '').trim();
  if (!str) return 'empty';
  
  const cleaned = str.replace(/[-,]/g, '').replace(/%$/, '');
  if (cleaned !== '' && !isNaN(Number(cleaned))) return 'number';
  return 'string';
};

export const getSignature = (row: any): Signature => {
  return rowToValues(row).map((v) => getCellType(v));
};

export const isStringOnlyRow = (sig: Signature): boolean => {
  return sig.some((t) => t === 'string') && sig.every((t) => t === 'string' || t === 'empty');
};

// ── 2. 개별 행 분류기 (Heuristics) ───────────────────────────────────────
// 수동 지정 모드로 전환됨에 따라 자동 탐지 로직이 제거되었습니다.

// ── 3. 빈 컬럼 / 빈 행 경계값 탐지 ──────────────────────────────────────────

export const getActiveColumnBounds = (rawRows: any[]): { left: number; right: number } => {
  if (rawRows.length === 0) return { left: 0, right: 0 };

  const firstRowValues = rowToValues(rawRows[0]);
  const maxCols = firstRowValues.length;

  let left = 0;
  let right = maxCols - 1;

  for (let c = 0; c < maxCols; c++) {
    const isAllEmpty = rawRows.every((row) => {
      const rowValues = rowToValues(row);
      const val = rowValues[c];
      return val === undefined || val === null || String(val).trim() === "";
    });
    if (isAllEmpty) left++;
    else break;
  }

  for (let c = maxCols - 1; c >= left; c--) {
    const isAllEmpty = rawRows.every((row) => {
      const rowValues = rowToValues(row);
      const val = rowValues[c];
      return val === undefined || val === null || String(val).trim() === "";
    });
    if (isAllEmpty) right--;
    else break;
  }

  return { left, right };
};

export const getActiveRowBounds = (rawRows: any[]): { top: number; bottom: number } => {
  if (rawRows.length === 0) return { top: 0, bottom: 0 };

  let top = 0;
  let bottom = rawRows.length - 1;

  for (let r = 0; r < rawRows.length; r++) {
    const rowValues = rowToValues(rawRows[r]);
    const isAllEmpty = rowValues.every(
      (val) => val === undefined || val === null || String(val).trim() === ""
    );
    if (isAllEmpty) top++;
    else break;
  }

  for (let r = rawRows.length - 1; r >= top; r--) {
    const rowValues = rowToValues(rawRows[r]);
    const isAllEmpty = rowValues.every(
      (val) => val === undefined || val === null || String(val).trim() === ""
    );
    if (isAllEmpty) bottom--;
    else break;
  }

  return { top, bottom };
};

// ── 4. 행 필터링 로직 ───────────────────────────────────────────────────

export const filterRows = (
  rawRows: any[], 
  absoluteDataStartRow: number = -1, 
  absoluteHeaderStartRow: number = -1
): any[] => {
  return rawRows.filter((row, idx) => {
    const rowValues = rowToValues(row);

    // 1. 완전히 비어있는 행 제거
    const isAllEmpty = rowValues.every(
      (val) => val === undefined || val === null || String(val).trim() === ""
    );
    if (isAllEmpty) return false;

    return true;
  });
};

// ── 5. 데이터 영역 분석 상태 머신 ──────────────────────────────────────────
// 수동 지정으로 대체됨에 따라 detectDataArea는 제거되었습니다.
