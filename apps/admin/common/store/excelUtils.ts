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

/**
 * 일반 노이즈 행 판별 (완전 빈 행 또는 데이터가 극도로 희소한 행)
 */
export const isGeneralNoiseRow = (row: any, totalCols: number): boolean => {
  const values = rowToValues(row).map((v) => String(v ?? '').trim());
  const nonEmptyCount = values.filter((v) => v !== '').length;

  if (nonEmptyCount === 0) return true; // 완전 빈 행

  // 값의 밀집도가 25% 이하이면서 동시에 채워진 셀이 2개 이하인 경우
  if (nonEmptyCount <= Math.max(2, Math.floor(totalCols * 0.25))) return true;

  return false;
};

/**
 * 구조 기반 결제선 행 판별 (키워드 비의존성)
 */
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

/**
 * 특정 행의 카테고리를 엄격하게 분류하는 판별기
 */
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

// ── 5. 데이터 영역 분석 상태 머신 ──────────────────────────────────────────

export const detectDataArea = (rows: any[]): {
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

  // 시그니처 매칭 헬퍼 함수
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
    // 다단 헤더 방어: 스캔 상단부에 위치한 문자열 전용 행은 데이터 시작 후보에서 건너뜀
    if (i < 3 && hasNonStringOnlyRow && isStringOnlyRow(sigs[i])) {
      continue;
    }

    for (let k = 1; k <= MAX_RECORD_HEIGHT; k++) {
      if (i + k >= SCAN_LIMIT) break;
      
      if (sigMatch(sigs[i], sigs[i + k])) {
        let allMatched = true;

        // 검증 1: 레코드 높이 k > 1 시 내부 오프셋 검증
        for (let offset = 1; offset < k; offset++) {
          if (i + k + offset >= SCAN_LIMIT) break;
          if (!sigMatch(sigs[i + offset], sigs[i + k + offset])) {
            allMatched = false;
            break;
          }
        }

        // 검증 2: 반복 주기 세트 추가 일치성 검증 (i + 2*k)
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

  // 패턴 미검출 시 폴백 데이터 지정 (헤더 다음 행이 데이터라고 추정)
  if (!foundDataPattern) {
    dataStartRow = Math.min(scanStart + 2, rows.length - 1);
    recordHeight = 1;
  }

  // STEP 3. 데이터 시작 행이 스캔 시작점과 같다면 헤더가 누락된 시트로 판단하고 합성 헤더 제공
  if (dataStartRow === scanStart) {
    const colCount = rowToValues(rows[scanStart]).length;
    return {
      headerStartRow: scanStart,
      dataStartRow,
      recordHeight,
      syntheticHeaderNames: Array.from({ length: colCount }, (_, i) => `컬럼${i + 1}`),
    };
  }

  // STEP 4. 헤더 시작 행(headerStartRow) 역방향 탐색
  let headerStartRow = dataStartRow - 1;
  while (headerStartRow > 0) {
    const prevRow = rows[headerStartRow - 1];
    const prevValues = rowToValues(prevRow).map((v) => String(v ?? '').trim());
    const nonEmptyCount = prevValues.filter((v) => v !== '').length;

    // 상위 행이 완전히 비어있거나, 결제선이거나, 문자열 전용이 아니거나, 유효 셀이 1개 이하(제목 등)이면 탐색 중단
    if (
      nonEmptyCount <= 1 ||
      isApprovalLineRow(prevRow, headerStartRow - 1, rows, totalCols) ||
      !isStringOnlyRow(sigs[headerStartRow - 1])
    ) {
      break;
    }
    headerStartRow--;
  }

  // STEP 5. 고밀도 헤더 오버라이드 (Override)
  // SCAN_LIMIT 내에 밀집도가 높은(>=70%) 첫 번째 헤더 후보 행(firstHighDensityRowIdx)이 존재한다면,
  // 기존에 검출된 headerStartRow가 이 고밀도 행보다 위에 있을 때 덮어씌웁니다.
  let firstHighDensityRowIdx = -1;
  for (let i = 0; i < SCAN_LIMIT; i++) {
    const category = classifyRow(rows[i], i, rows, totalCols);
    if (category === 'HEADER_CANDIDATE') {
      firstHighDensityRowIdx = i;
      break; // 첫 번째로 마주한 고밀도 표 헤더 후보에서 탐색 종료
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
