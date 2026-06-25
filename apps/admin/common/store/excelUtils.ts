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

/* [참고용 이전 로직 주석 처리]
export const isGeneralNoiseRow = (row: any, totalCols: number): boolean => {
  const values = rowToValues(row).map((v) => String(v ?? '').trim());
  const nonEmptyCount = values.filter((v) => v !== '').length;

  if (nonEmptyCount === 0) return true; // 완전 빈 행

  // 값의 밀집도가 25% 이하이면서 동시에 채워진 셀이 2개 이하인 경우
  if (nonEmptyCount <= Math.max(2, Math.floor(totalCols * 0.25))) return true;

  return false;
};

export const isApprovalLineRow = (row: any, idx: number, rows: any[], totalCols: number): boolean => {
  const values = rowToValues(row).map((v) => String(v ?? '').trim());
  const nonEmptyIndices = values
    .map((v, i) => i)
    .filter((i) => values[i] !== '');

  if (nonEmptyIndices.length === 0) return false;

  const firstNonEmpty = nonEmptyIndices[0];
  const nonEmptyCount = nonEmptyIndices.length;
  const density = nonEmptyCount / totalCols;

  // 결제선은 밀집도가 65% 이하임
  if (density <= 0.65) {
    const midPoint = Math.floor(totalCols / 2);
    const rightHalfCount = values.slice(midPoint).filter((v) => v !== '').length;

    // 조건 A: 우측 영역에 2개 이상의 셀이 존재하며, 바로 하단 행이 비어있거나 거의 비어있음
    if (rightHalfCount >= 2) {
      const nextRow = rows[idx + 1];
      if (nextRow) {
        const nextValues = rowToValues(nextRow).map((v) => String(v ?? '').trim());
        const nextNonEmptyCount = nextValues.filter((v) => v !== '').length;
        if (nextNonEmptyCount <= 1) return true;
      } else {
        return true; // 마지막 행이면 결제선으로 판정
      }
    }

    // 조건 B: 순수 우측 편향 단독 행이면서 하단 행이 빈/노이즈 행임
    if (firstNonEmpty > 0 && firstNonEmpty >= Math.floor(totalCols / 3)) {
      const nextRow = rows[idx + 1];
      if (nextRow) {
        const nextValues = rowToValues(nextRow).map((v) => String(v ?? '').trim());
        const nextNonEmptyCount = nextValues.filter((v) => v !== '').length;
        if (nextNonEmptyCount <= 1) return true;
      } else {
        return true;
      }
    }
  }

  return false;
};

export const classifyRow = (row: any, idx: number, rows: any[], totalCols: number): RowCategory => {
  const values = rowToValues(row).map((v) => String(v ?? '').trim());
  const nonEmptyCount = values.filter((v) => v !== '').length;
  const sig = getSignature(row);

  if (nonEmptyCount === 0) {
    return 'EMPTY';
  }

  if (isApprovalLineRow(row, idx, rows, totalCols)) {
    return 'APPROVAL';
  }

  if (isGeneralNoiseRow(row, totalCols)) {
    return 'TITLE';
  }

  const density = nonEmptyCount / totalCols;
  const hasString = sig.some((t) => t === 'string');

  if (density >= 0.7 && hasString) {
    return 'HEADER_CANDIDATE';
  }

  return 'UNKNOWN';
};
*/

// 임시 컴파일용 더미 로직 (참고용 로직은 상단 주석에 보존됨)
export const isGeneralNoiseRow = (row: any, totalCols: number): boolean => {
  return false;
};

export const isApprovalLineRow = (row: any, idx: number, rows: any[], totalCols: number): boolean => {
  return false;
};

export const classifyRow = (row: any, idx: number, rows: any[], totalCols: number): RowCategory => {
  return 'UNKNOWN';
};

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

/* [참고용 이전 필터링 로직 주석 처리]
export const filterRowsOriginal = (
  rawRows: any[], 
  absoluteDataStartRow: number = -1, 
  absoluteHeaderStartRow: number = -1
): any[] => {
  const totalCols = rawRows.length > 0 
    ? Math.max(1, ...rawRows.slice(0, Math.min(5, rawRows.length)).map((r) => rowToValues(r).length))
    : 1;

  return rawRows.filter((row, idx) => {
    const rowValues = rowToValues(row);

    // 1. 완전히 비어있는 행 제거
    const isAllEmpty = rowValues.every(
      (val) => val === undefined || val === null || String(val).trim() === ""
    );
    if (isAllEmpty) return false;

    const originalRowIndex = row._originalRowIndex !== undefined ? row._originalRowIndex : row.rowIndex;

    // 2. 헤더 시작 위치(absoluteHeaderStartRow) 이전의 모든 행은 무조건 필터링 (원천 삭제)
    if (absoluteHeaderStartRow !== -1 && originalRowIndex < absoluteHeaderStartRow) {
      return false;
    }

    // 3. 결제선 및 일반 노이즈 검출 - 헤더보다 위쪽의 영역에 대해서만 물리적으로 원천 삭제 (진짜 헤더 영역 내부의 상위 다단 헤더는 보호)
    if (absoluteDataStartRow !== -1 && originalRowIndex < absoluteDataStartRow) {
      const isBeforeHeader = absoluteHeaderStartRow !== -1 && originalRowIndex < absoluteHeaderStartRow;
      const isHeaderUnset = absoluteHeaderStartRow === -1;
      if (isBeforeHeader || isHeaderUnset) {
        if (isApprovalLineRow(row, idx, rawRows, totalCols) || isGeneralNoiseRow(row, totalCols)) {
          return false;
        }
      }
    }

    // 4. 데이터 영역(rowIndex >= absoluteDataStartRow)에 대해서만 노이즈 필터링 적용 (연속된 빈칸 5개 이상 + 50% 빈 셀)
    if (absoluteDataStartRow !== -1 && originalRowIndex >= absoluteDataStartRow) {
      let emptyCount = 0;
      rowValues.forEach((val) => {
        const isCellEmpty = val === undefined || val === null || String(val).trim() === "";
        if (isCellEmpty) emptyCount++;
      });

      const is50PercentOrMoreEmpty = emptyCount >= totalCols * 0.5;

      let has5ConsecutiveEmpty = false;
      let consecutiveEmptyCount = 0;
      for (let i = 0; i < totalCols; i++) {
        const val = rowValues[i];
        const isEmpty = val === undefined || val === null || String(val).trim() === "";
        if (isEmpty) {
          consecutiveEmptyCount++;
          if (consecutiveEmptyCount >= 5) {
            has5ConsecutiveEmpty = true;
            break;
          }
        } else {
          consecutiveEmptyCount = 0;
        }
      }

      if (is50PercentOrMoreEmpty && has5ConsecutiveEmpty) {
        return false;
      }
    }

    return true;
  });
};
*/

// 실제 필터링 로직 (헤더 시작점 이전 불필요 영역 삭제 및 데이터 영역 내 빈칸 노이즈 제거)
export const filterRows = (
  rawRows: any[], 
  dataStartRow: number = -1, 
  headerStartRow: number = -1
): any[] => {
  const totalCols = rawRows.length > 0 
    ? Math.max(1, ...rawRows.slice(0, Math.min(5, rawRows.length)).map((r) => rowToValues(r).length))
    : 1;

  return rawRows.filter((row, idx) => {
    const rowValues = rowToValues(row);

    // 1. 완전히 비어있는 행 제거
    const isAllEmpty = rowValues.every(
      (val) => val === undefined || val === null || String(val).trim() === ""
    );
    if (isAllEmpty) return false;

    // 2. 헤더 시작 위치(headerStartRow) 이전의 모든 행은 무조건 필터링 (물리적 인덱스 idx 기준 불필요 영역 삭제)
    if (headerStartRow !== -1 && idx < headerStartRow) {
      return false;
    }

    // 3. 데이터 영역(idx >= dataStartRow)에 대해서만 노이즈 필터링 적용 (연속된 빈칸 5개 이상 + 50% 빈 셀)
    if (dataStartRow !== -1 && idx >= dataStartRow) {
      let emptyCount = 0;
      rowValues.forEach((val) => {
        const isCellEmpty = val === undefined || val === null || String(val).trim() === "";
        if (isCellEmpty) emptyCount++;
      });

      const is50PercentOrMoreEmpty = emptyCount >= totalCols * 0.5;

      let has5ConsecutiveEmpty = false;
      let consecutiveEmptyCount = 0;
      for (let i = 0; i < totalCols; i++) {
        const val = rowValues[i];
        const isEmpty = val === undefined || val === null || String(val).trim() === "";
        if (isEmpty) {
          consecutiveEmptyCount++;
          if (consecutiveEmptyCount >= 5) {
            has5ConsecutiveEmpty = true;
            break;
          }
        } else {
          consecutiveEmptyCount = 0;
        }
      }

      if (is50PercentOrMoreEmpty && has5ConsecutiveEmpty) {
        return false;
      }
    }

    return true;
  });
};

// ── 5. 데이터 영역 분석 상태 머신 ──────────────────────────────────────────

/* [참고용 이전 분석 로직 주석 처리]
export const detectDataAreaOriginal = (rows: any[]): {
  headerStartRow: number;
  dataStartRow: number;
  recordHeight: number;
  syntheticHeaderNames: string[] | null;
} => {
  const SCAN_LIMIT = Math.min(rows.length, 10);
  const MATCH_RATIO = 0.8;
  const MAX_RECORD_HEIGHT = 4;

  const totalCols = Math.max(
    1,
    ...rows.slice(0, Math.min(5, rows.length)).map((r) => rowToValues(r).length)
  );

  const sigs = rows.slice(0, SCAN_LIMIT).map(getSignature);

  const sigMatch = (a: Signature, b: Signature): boolean => {
    const len = Math.max(a.length, b.length);
    if (len === 0) return true;

    let structureMatched = 0;
    let typeMatched = 0;
    let compared = 0;

    for (let i = 0; i < len; i++) {
      const ta = a[i] ?? 'empty';
      const tb = b[i] ?? 'empty';

      if (ta === 'empty' && tb === 'empty') continue;

      compared++;
      const hasValueA = ta !== 'empty';
      const hasValueB = tb !== 'empty';

      if (hasValueA === hasValueB) structureMatched++;
      if (hasValueA && hasValueB && ta === tb) typeMatched++;
    }

    if (compared === 0) return true;
    const structureRatio = structureMatched / compared;
    const typeRatio = typeMatched / compared;
    return (structureRatio + typeRatio) / 2 >= MATCH_RATIO;
  };

  // STEP 1. 앞부분 결제선, 일반 노이즈(제목 등), 빈 행은 스캔 시작점 분류에서 건너뜀
  let scanStart = 0;
  while (scanStart < SCAN_LIMIT) {
    const category = classifyRow(rows[scanStart], scanStart, rows, totalCols);
    if (category === 'EMPTY' || category === 'TITLE' || category === 'APPROVAL') {
      scanStart++;
    } else {
      break;
    }
  }

  // 예외 가드: 10행 안에 유효한 행이 없는 경우 합성 헤더 생성
  if (scanStart >= SCAN_LIMIT) {
    const colCount = Math.max(1, rowToValues(rows[0] ?? {}).length);
    return {
      headerStartRow: 0,
      dataStartRow: 0,
      recordHeight: 1,
      syntheticHeaderNames: Array.from({ length: colCount }, (_, i) => `컬럼${i + 1}`),
    };
  }

  // STEP 2. 데이터 시작 행(dataStartRow) 및 레코드 높이(recordHeight) 패턴 탐색
  let dataStartRow = scanStart + 1;
  let recordHeight = 1;
  let foundDataPattern = false;

  const startScanIdx = Math.min(scanStart + 1, SCAN_LIMIT - 1);
  const hasNonStringOnlyRow = sigs.slice(startScanIdx, SCAN_LIMIT).some((sig) => !isStringOnlyRow(sig));

  for (let i = startScanIdx; i < SCAN_LIMIT - 1; i++) {
    if (i < 3 && hasNonStringOnlyRow && isStringOnlyRow(sigs[i])) {
      continue;
    }

    for (let k = 1; k <= MAX_RECORD_HEIGHT; k++) {
      if (i + k >= SCAN_LIMIT) break;
      
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
          dataStartRow = i;
          recordHeight = k;
          foundDataPattern = true;
          break;
        }
      }
    }
    if (foundDataPattern) break;
  }

  if (!foundDataPattern) {
    dataStartRow = Math.min(scanStart + 2, rows.length - 1);
    recordHeight = 1;
  }

  if (dataStartRow === scanStart) {
    const colCount = rowToValues(rows[scanStart]).length;
    return {
      headerStartRow: scanStart,
      dataStartRow,
      recordHeight,
      syntheticHeaderNames: Array.from({ length: colCount }, (_, i) => `컬럼${i + 1}`),
    };
  }

  let headerStartRow = dataStartRow - 1;
  while (headerStartRow > 0) {
    const prevRow = rows[headerStartRow - 1];
    const prevValues = rowToValues(prevRow).map((v) => String(v ?? '').trim());
    const nonEmptyCount = prevValues.filter((v) => v !== '').length;

    if (
      nonEmptyCount <= 1 ||
      isApprovalLineRow(prevRow, headerStartRow - 1, rows, totalCols) ||
      !isStringOnlyRow(sigs[headerStartRow - 1])
    ) {
      break;
    }
    headerStartRow--;
  }

  let firstHighDensityRowIdx = -1;
  for (let i = 0; i < SCAN_LIMIT; i++) {
    const category = classifyRow(rows[i], i, rows, totalCols);
    if (category === 'HEADER_CANDIDATE') {
      firstHighDensityRowIdx = i;
      break;
    }
  }

  if (firstHighDensityRowIdx !== -1) {
    if (headerStartRow < firstHighDensityRowIdx) {
      let newHeaderStart = firstHighDensityRowIdx;
      while (newHeaderStart > 0) {
        const prevRow = rows[newHeaderStart - 1];
        const prevValues = rowToValues(prevRow).map((v) => String(v ?? '').trim());
        const nonEmptyCount = prevValues.filter((v) => v !== '').length;

        if (
          nonEmptyCount <= 1 ||
          isApprovalLineRow(prevRow, newHeaderStart - 1, rows, totalCols) ||
          !isStringOnlyRow(sigs[newHeaderStart - 1])
        ) {
          break;
        }
        newHeaderStart--;
      }

      headerStartRow = newHeaderStart;
      dataStartRow = Math.max(dataStartRow, firstHighDensityRowIdx + 1);
    }
  }

  return {
    headerStartRow,
    dataStartRow,
    recordHeight,
    syntheticHeaderNames: null,
  };
};
*/

// 실제 데이터 영역 분석 상태 머신 (상위 10행 중 최고 밀집도 행을 헤더 앵커로 잡고 분석 시작)
export const detectDataArea = (rows: any[]): {
  headerStartRow: number;
  dataStartRow: number;
  recordHeight: number;
  syntheticHeaderNames: string[] | null;
} => {
  if (rows.length === 0) {
    return {
      headerStartRow: 0,
      dataStartRow: 0,
      recordHeight: 1,
      syntheticHeaderNames: [],
    };
  }

  const SCAN_LIMIT = Math.min(rows.length, 10);
  const totalCols = Math.max(
    1,
    ...rows.slice(0, Math.min(5, rows.length)).map((r) => rowToValues(r).length)
  );

  const sigs = rows.slice(0, SCAN_LIMIT).map(getSignature);

  // 1. 상위 10행의 밀집도를 계산하여 헤더 앵커(bestHeaderIdx) 탐색
  let maxDensity = -1;
  let bestHeaderIdx = 0;
  const HIGH_DENSITY_THRESHOLD = 0.7; // 헤더로 인정할 최소 밀집도 임계치 (70%)

  for (let i = 0; i < SCAN_LIMIT; i++) {
    const row = rows[i];
    const values = rowToValues(row).map((v) => String(v ?? '').trim());
    const nonEmptyCount = values.filter((v) => v !== '').length;
    const density = nonEmptyCount / totalCols;

    const sig = sigs[i];
    const hasString = sig.some((t) => t === 'string');

    // 밀집도가 현재까지의 최댓값보다 큰 경우 갱신
    if (density > maxDensity) {
      // (1) 아직 고밀도 헤더 임계치에 도달하지 못했거나
      // (2) 더 큰 밀집도를 가진 행이며 문자가 포함된 경우(헤더다운 행)에만 앵커를 데이터 행에 뺏기지 않도록 갱신
      if (maxDensity < HIGH_DENSITY_THRESHOLD || hasString) {
        maxDensity = density;
        bestHeaderIdx = i;
      }
    }
  }

  // 감지된 임계치가 극도로 낮다면 기본값 0 사용
  if (maxDensity <= 0.1) {
    bestHeaderIdx = 0;
  }

  // 2. 데이터 시작 행(dataStartRow) 및 레코드 높이(recordHeight) 패턴 탐색
  // 패턴 검사 시작 위치(scanStart)는 찾은 최대 밀집도 행(bestHeaderIdx)
  const scanStart = bestHeaderIdx;

  let dataStartRow = scanStart + 1;
  let recordHeight = 1;
  let foundDataPattern = false;

  const MAX_RECORD_HEIGHT = 4;
  const MATCH_RATIO = 0.8;

  const sigMatch = (a: Signature, b: Signature): boolean => {
    const len = Math.max(a.length, b.length);
    if (len === 0) return true;

    let structureMatched = 0;
    let typeMatched = 0;
    let compared = 0;

    for (let i = 0; i < len; i++) {
      const ta = a[i] ?? 'empty';
      const tb = b[i] ?? 'empty';

      if (ta === 'empty' && tb === 'empty') continue;

      compared++;
      const hasValueA = ta !== 'empty';
      const hasValueB = tb !== 'empty';

      if (hasValueA === hasValueB) structureMatched++;
      if (hasValueA && hasValueB && ta === tb) typeMatched++;
    }

    if (compared === 0) return true;
    const structureRatio = structureMatched / compared;
    const typeRatio = typeMatched / compared;
    return (structureRatio + typeRatio) / 2 >= MATCH_RATIO;
  };

  const startScanIdx = Math.min(scanStart + 1, rows.length - 1);
  const scanSigs = rows.map(getSignature);

  for (let i = startScanIdx; i < Math.min(rows.length - 1, startScanIdx + 10); i++) {
    const sigI = scanSigs[i];
    if (!sigI) continue;

    for (let k = 1; k <= MAX_RECORD_HEIGHT; k++) {
      if (i + k >= rows.length) break;

      const sigIK = scanSigs[i + k];
      if (sigIK && sigMatch(sigI, sigIK)) {
        let allMatched = true;

        for (let offset = 1; offset < k; offset++) {
          if (i + k + offset >= rows.length) break;
          const sigIOffset = scanSigs[i + offset];
          const sigIKOffset = scanSigs[i + k + offset];
          if (!sigIOffset || !sigIKOffset || !sigMatch(sigIOffset, sigIKOffset)) {
            allMatched = false;
            break;
          }
        }

        if (allMatched && i + 2 * k < rows.length) {
          for (let offset = 0; offset < k; offset++) {
            if (i + 2 * k + offset >= rows.length) break;
            const sigIOffset = scanSigs[i + offset];
            const sigI2KOffset = scanSigs[i + 2 * k + offset];
            if (!sigIOffset || !sigI2KOffset || !sigMatch(sigIOffset, sigI2KOffset)) {
              allMatched = false;
              break;
            }
          }
        }

        if (allMatched) {
          dataStartRow = i;
          recordHeight = k;
          foundDataPattern = true;
          break;
        }
      }
    }
    if (foundDataPattern) break;
  }

  if (!foundDataPattern) {
    dataStartRow = Math.min(scanStart + 1, rows.length - 1);
    recordHeight = 1;
  }

  // 3. 헤더 시작 위치(headerStartRow) 위로 탐색
  // dataStartRow 바로 윗행부터 위로 역방향 스캔하되, 0번 행까지 탐색 범위를 넓힙니다.
  // 단, 결제선/제목/빈 행 등 노이즈 조건을 만나면 중단합니다.
  let headerStartRow = dataStartRow - 1;
  while (headerStartRow > 0) {
    const prevRow = rows[headerStartRow - 1];
    const prevValues = rowToValues(prevRow).map((v) => String(v ?? '').trim());
    const nonEmptyCount = prevValues.filter((v) => v !== '').length;

    // 결제선 직급/사인 키워드 검사
    const approvalKeywords = [
      '담당', '검토', '승인', '결재', '합의', '결제', 
      '팀장', '부장', '과장', '대리', '대표', '소장', 
      '임원', '사장', '회장', '직인', '서명'
    ];
    const hasApprovalKeyword = prevValues.some((val) => 
      approvalKeywords.some((kw) => val.includes(kw))
    );

    const midPoint = Math.floor(totalCols / 2);
    const leftHalfCount = prevValues.slice(0, midPoint).filter((v) => v !== '').length;
    const rightHalfCount = prevValues.slice(midPoint).filter((v) => v !== '').length;

    // 우측 편향 결제선 판별 (좌측은 비어있고 우측에 집중되었으며 결제 직급 키워드가 있는 경우)
    const isApprovalLine = leftHalfCount === 0 && rightHalfCount >= 1 && hasApprovalKeyword;

    const sig = scanSigs[headerStartRow - 1];
    
    // 중단 조건:
    // 1) 완전히 비어있거나 값이 1개 이하인 행 (제목 등 노이즈)
    // 2) 문자 전용 행이 아닌 경우 (숫자가 포함된 데이터 행 등)
    // 3) 결제 키워드가 섞인 우측 편향 결제선 노이즈인 경우
    if (
      nonEmptyCount <= 1 ||
      (sig && !isStringOnlyRow(sig)) ||
      isApprovalLine
    ) {
      break;
    }
    headerStartRow--;
  }

  // 앵커 행(bestHeaderIdx)은 핵심 표 헤더이므로, headerStartRow가 이 앵커보다 밑으로(아래로) 지정되는 것을 방지합니다.
  if (headerStartRow > bestHeaderIdx) {
    headerStartRow = bestHeaderIdx;
  }

  return {
    headerStartRow,
    dataStartRow,
    recordHeight,
    syntheticHeaderNames: null,
  };
};

