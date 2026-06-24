"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useExcelStore = exports.detectDataArea = exports.filterRows = exports.getActiveRowBounds = exports.getActiveColumnBounds = exports.getSignature = exports.isStringOnlyRow = exports.getCellType = exports.rowToValues = void 0;
const zustand_1 = require("zustand");
const axios_1 = __importDefault(require("axios"));
const rowToValues = (row) => {
    if (row === null || row === undefined)
        return [];
    // 배열이 직접 들어있는 경우
    const arrayValue = Object.values(row).find((v) => Array.isArray(v));
    if (arrayValue)
        return arrayValue;
    // rowIndex, _originalRowIndex 등의 내부 메타데이터 필드를 제외하고 순수 데이터 값만 추출
    return Object.keys(row)
        .filter((k) => k !== 'rowIndex' && k !== '_originalRowIndex')
        .map((k) => row[k]);
};
exports.rowToValues = rowToValues;
const getCellType = (val) => {
    const trimmed = val.trim();
    if (!trimmed)
        return 'empty';
    const cleaned = trimmed.replace(/[-,]/g, '').replace(/%$/, '');
    if (cleaned !== '' && !isNaN(Number(cleaned)))
        return 'number';
    return 'string';
};
exports.getCellType = getCellType;
const isStringOnlyRow = (sig) => sig.some((t) => t === 'string') && sig.every((t) => t === 'string' || t === 'empty');
exports.isStringOnlyRow = isStringOnlyRow;
const getSignature = (row) => (0, exports.rowToValues)(row).map((v) => (0, exports.getCellType)(String(v ?? '')));
exports.getSignature = getSignature;
// 행 데이터에서 빈 열들을 잘라내기 위한 좌우 경계값 계산 헬퍼 함수
const getActiveColumnBounds = (rawRows) => {
    if (rawRows.length === 0)
        return { left: 0, right: 0 };
    const firstRowValues = (0, exports.rowToValues)(rawRows[0]);
    const maxCols = firstRowValues.length;
    let left = 0;
    let right = maxCols - 1;
    // 1. 왼쪽 빈 컬럼 오프셋 구하기
    for (let c = 0; c < maxCols; c++) {
        const isAllEmpty = rawRows.every((row) => {
            const rowValues = (0, exports.rowToValues)(row);
            const val = rowValues[c];
            return val === undefined || val === null || String(val).trim() === "";
        });
        if (isAllEmpty) {
            left++;
        }
        else {
            break;
        }
    }
    // 2. 오른쪽 빈 컬럼 오프셋 구하기
    for (let c = maxCols - 1; c >= left; c--) {
        const isAllEmpty = rawRows.every((row) => {
            const rowValues = (0, exports.rowToValues)(row);
            const val = rowValues[c];
            return val === undefined || val === null || String(val).trim() === "";
        });
        if (isAllEmpty) {
            right--;
        }
        else {
            break;
        }
    }
    return { left, right };
};
exports.getActiveColumnBounds = getActiveColumnBounds;
// 행 데이터에서 빈 행들을 잘라내기 위한 상하 경계값 계산 헬퍼 함수
const getActiveRowBounds = (rawRows) => {
    if (rawRows.length === 0)
        return { top: 0, bottom: 0 };
    let top = 0;
    let bottom = rawRows.length - 1;
    // 1. 위쪽 빈 행 오프셋 구하기
    for (let r = 0; r < rawRows.length; r++) {
        const rowValues = (0, exports.rowToValues)(rawRows[r]);
        const isAllEmpty = rowValues.every((val) => val === undefined || val === null || String(val).trim() === "");
        if (isAllEmpty) {
            top++;
        }
        else {
            break;
        }
    }
    // 2. 아래쪽 빈 행 오프셋 구하기
    for (let r = rawRows.length - 1; r >= top; r--) {
        const rowValues = (0, exports.rowToValues)(rawRows[r]);
        const isAllEmpty = rowValues.every((val) => val === undefined || val === null || String(val).trim() === "");
        if (isAllEmpty) {
            bottom--;
        }
        else {
            break;
        }
    }
    return { top, bottom };
};
exports.getActiveRowBounds = getActiveRowBounds;
// 행 데이터 필터링 헬퍼 함수
// 1. 전부 빈칸인 행만 삭제 (기존 우측 편향 노이즈 필터는 2단 헤더 오작동 및 인덱스 꼬임 유발로 제거)
const filterRows = (rawRows, absoluteDataStartRow = -1) => {
    return rawRows.filter((row) => {
        const rowValues = (0, exports.rowToValues)(row);
        const totalCols = rowValues.length;
        // 1. 전부 빈칸인지 검사
        const isAllEmpty = rowValues.every((val) => val === undefined || val === null || String(val).trim() === "");
        if (isAllEmpty)
            return false;
        // 2. 데이터 영역(rowIndex >= absoluteDataStartRow)에 대해서만 우측 편향 노이즈 필터링 적용
        // 헤더를 찾는 프로세스(헤더 영역)에서는 이 노이즈 삭제가 동작하지 않도록 방어합니다.
        const originalRowIndex = row._originalRowIndex !== undefined ? row._originalRowIndex : row.rowIndex;
        if (absoluteDataStartRow !== -1 && originalRowIndex >= absoluteDataStartRow) {
            let emptyCount = 0;
            let firstNonEmptyIdx = -1;
            rowValues.forEach((val, idx) => {
                const isCellEmpty = val === undefined || val === null || String(val).trim() === "";
                if (isCellEmpty) {
                    emptyCount++;
                }
                else {
                    if (firstNonEmptyIdx === -1) {
                        firstNonEmptyIdx = idx;
                    }
                }
            });
            const is50PercentOrMoreEmpty = emptyCount >= totalCols * 0.5;
            const isRightLeaning = firstNonEmptyIdx >= totalCols * 0.5;
            let has3ConsecutiveEmpty = false;
            let consecutiveEmptyCount = 0;
            for (let i = 0; i < totalCols; i++) {
                const val = rowValues[i];
                const isEmpty = val === undefined || val === null || String(val).trim() === "";
                if (isEmpty) {
                    consecutiveEmptyCount++;
                    if (consecutiveEmptyCount >= 3) {
                        has3ConsecutiveEmpty = true;
                        break;
                    }
                }
                else {
                    consecutiveEmptyCount = 0;
                }
            }
            if (is50PercentOrMoreEmpty && isRightLeaning && has3ConsecutiveEmpty) {
                return false; // 데이터 영역 내의 결제선/노이즈 삭제 대상 행
            }
        }
        return true;
    });
};
exports.filterRows = filterRows;
/**
 * 행의 타입 시그니처를 기반으로 데이터 시작 행과 레코드 높이를 자동으로 추정합니다.
 *
 * ─ 처리 순서 ─────────────────────────────────────────────────────────────
 *  STEP 1. 노이즈 행 건너뛰기
 *    - 완전 빈 행
 *    - 결제선 (우측 편향): 첫 번째 유효 셀이 전체 열의 50% 이후에 위치
 *      ex) ["","","","","기안","검토","승인"] → 우측 3칸에만 값
 *    - 병합 제목 (좌측 sparse): 유효 셀 수가 전체의 25% 이하이고 최대 2개
 *      ex) ["월별 매출 현황","","","",""] → 첫 칸에만 값
 *
 *  STEP 2. 헤더 영역 탐지
 *    - 노이즈를 건너뛴 후, string-only 연속 행을 헤더로 수집
 *    - 헤더 행: 비어있지 않은 모든 셀이 string (숫자 하나도 없음)
 *
 *  STEP 3. 데이터 시작 확정
 *    - 헤더 영역 바로 다음 행 = dataStartRow
 *
 *  STEP 4. recordHeight 결정 (90% 일치 임계값)
 *    - row[dataStart]를 기준 패턴으로 저장
 *    - k=1,2,3,4 순서로 row[dataStart+k]와 비교
 *    - 90% 이상 타입이 일치하는 k가 recordHeight
 *      ex) k=1 일치 → 1행 레코드 / k=2 일치 → 2행 레코드
 * ──────────────────────────────────────────────────────────────────────────
 */
const detectDataArea = (rows) => {
    //
    //  ※ 10행 제한: 헤더·데이터 영역 모두 첫 10행 안에서만 판단한다.
    //     10행 안에 string-only 헤더가 없으면 → 합성 헤더(컬럼1, 컬럼2 ...) 자동 생성
    //
    const SCAN_LIMIT = Math.min(rows.length, 10);
    const MATCH_RATIO = 0.8; // 패턴 매칭 임계치 (구조와 타입이 80% 이상 일치하면 같은 패턴으로 간주)
    const MAX_RECORD_HEIGHT = 4; // 탐색할 최대 레코드 높이
    // 전체 열 수: 처음 몇 개 행 중 가장 긴 것 기준 (파싱 방식에 따른 길이 차이 대응)
    const totalCols = Math.max(1, ...rows.slice(0, Math.min(5, rows.length)).map((r) => (0, exports.rowToValues)(r).length));
    // ── 노이즈 행 판별 ────────────────────────────────────────────────────
    //   결제선 / 병합 제목 / 완전 빈 행 모두 "건너뛸 행"으로 처리
    const isNoiseRow = (row) => {
        const values = (0, exports.rowToValues)(row).map((v) => String(v ?? '').trim());
        const nonEmptyIndices = values
            .map((v, i) => ({ i, v }))
            .filter(({ v }) => v !== '')
            .map(({ i }) => i);
        // 완전 빈 행
        if (nonEmptyIndices.length === 0)
            return true;
        const firstNonEmpty = nonEmptyIndices[0];
        const nonEmptyCount = nonEmptyIndices.length;
        // 결제선: 첫 유효 셀이 전체 열의 일정 지점 이후에 위치 (우측 편향)
        //   ex) 4열 기준 → firstNonEmpty >= 1 이면 우측 편향으로 인정 (빈칸 1개 + 문자 3개)
        if (firstNonEmpty > 0 && firstNonEmpty >= Math.floor(totalCols / 3))
            return true;
        // 병합 제목: 유효 셀이 극히 적고(≤25% 또는 최대 2개) 좌측에 편중
        //   ex) ["월별현황","","","","","","",""] → nonEmptyCount=1, firstNonEmpty=0
        if (nonEmptyCount <= Math.max(2, Math.floor(totalCols * 0.25)) && firstNonEmpty < 3)
            return true;
        return false;
    };
    // ── 헤더 행 판별 ──────────────────────────────────────────────────────
    // 바깥의 isStringOnlyRow 사용
    //   1. 구조 일치도 (값이 둘 다 있거나 둘 다 비어있는지)
    //   2. 타입 일치도 (둘 다 값이 있을 때 타입이 같은지)
    //   두 일치도의 평균이 MATCH_RATIO(80%) 이상일 때 동일 패턴으로 판별
    const sigMatch = (a, b) => {
        const len = Math.max(a.length, b.length);
        if (len === 0)
            return true;
        let structureMatched = 0;
        let typeMatched = 0;
        let compared = 0;
        for (let i = 0; i < len; i++) {
            const ta = a[i] ?? 'empty';
            const tb = b[i] ?? 'empty';
            // 둘 다 비어있는 열은 엑셀 특성상 무의미하게 길이를 늘릴 수 있으므로 점수 산정에서 제외
            if (ta === 'empty' && tb === 'empty')
                continue;
            compared++;
            const hasValueA = ta !== 'empty';
            const hasValueB = tb !== 'empty';
            // 1. 값이 있는지 비어있는지 구조 비교
            if (hasValueA === hasValueB) {
                structureMatched++;
            }
            // 2. 둘 다 값이 있고 타입이 같으면 타입 일치
            if (hasValueA && hasValueB && ta === tb) {
                typeMatched++;
            }
        }
        if (compared === 0)
            return true;
        const structureRatio = structureMatched / compared;
        const typeRatio = typeMatched / compared;
        const avgRatio = (structureRatio + typeRatio) / 2;
        return avgRatio >= MATCH_RATIO;
    };
    const sigs = rows.slice(0, SCAN_LIMIT).map(exports.getSignature);
    console.log("=== [detectDataArea] Scan Start ===");
    console.log("SCAN_LIMIT:", SCAN_LIMIT, "Rows count:", rows.length);
    sigs.forEach((sig, idx) => {
        console.log(`Row ${idx} (Original index: ${rows[idx]?.rowIndex}):`, sig, "isStringOnly:", (0, exports.isStringOnlyRow)(sig));
    });
    // STEP 1. 앞부분 노이즈 행 건너뛰기 (빈 행 / 결제선 / 병합 제목)
    let scanStart = 0;
    while (scanStart < SCAN_LIMIT && isNoiseRow(rows[scanStart])) {
        scanStart++;
    }
    console.log("scanStart index after noise skipping:", scanStart);
    // 10행 안에 유효한 행이 전혀 없으면 폴백
    if (scanStart >= SCAN_LIMIT) {
        const colCount = Math.max(1, (0, exports.rowToValues)(rows[0] ?? {}).length);
        console.log("[detectDataArea] Fallback triggered: no valid rows found in SCAN_LIMIT.");
        return {
            dataStartRow: 0,
            recordHeight: 1,
            syntheticHeaderNames: Array.from({ length: colCount }, (_, i) => `컬럼${i + 1}`),
        };
    }
    // STEP 2. 데이터 시작 행(dataStartRow) 및 레코드 높이(recordHeight) 탐색
    // 첫 행(scanStart) 대신 두 번째 행(scanStart + 1)부터 시작하여 데이터 패턴 매칭을 진행합니다.
    let dataStartRow = scanStart + 1;
    let recordHeight = 1;
    let foundDataPattern = false;
    const startScanIdx = Math.min(scanStart + 1, SCAN_LIMIT - 1);
    // 10행 이내의 행들 중 문자열 전용이 아닌(숫자/날짜/전화번호 등이 포함된) 행이 있는지 확인
    const hasNonStringOnlyRow = sigs.slice(startScanIdx, SCAN_LIMIT).some((sig) => !(0, exports.isStringOnlyRow)(sig));
    console.log("hasNonStringOnlyRow inside limit:", hasNonStringOnlyRow);
    for (let i = startScanIdx; i < SCAN_LIMIT - 1; i++) {
        // 가드: 10행 내에 숫자 등이 포함된 진짜 데이터 행이 존재하는 문서라면,
        // 문자열(string)로만 가득 찬 행(예: 2단 헤더의 두 번째 줄)은 데이터의 첫 시작이 될 수 없으므로 건너뜁니다.
        if (hasNonStringOnlyRow && (0, exports.isStringOnlyRow)(sigs[i])) {
            console.log(`Row ${i} is string-only and hasNonStringOnlyRow is true, skipping from data start candidate.`);
            continue;
        }
        for (let k = 1; k <= MAX_RECORD_HEIGHT; k++) {
            if (i + k >= SCAN_LIMIT)
                break;
            if (sigMatch(sigs[i], sigs[i + k])) {
                let allMatched = true;
                // 검증 1: 레코드 높이 k > 1 인 경우, 해당 레코드 내부의 다른 행들(offset)도 매칭되는지 연속 검증
                for (let offset = 1; offset < k; offset++) {
                    if (i + k + offset >= SCAN_LIMIT)
                        break;
                    if (!sigMatch(sigs[i + offset], sigs[i + k + offset])) {
                        allMatched = false;
                        break;
                    }
                }
                // 검증 2: 세 번째 세트(i + 2*k)가 스캔 영역 내에 존재한다면, 다음 반복 세트도 일관되게 일치하는지 추가 검증
                if (allMatched && i + 2 * k < SCAN_LIMIT) {
                    for (let offset = 0; offset < k; offset++) {
                        if (i + 2 * k + offset >= SCAN_LIMIT)
                            break;
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
                    console.log(`[detectDataArea] Found matching pattern starting at row ${i} with recordHeight ${k}`);
                    break;
                }
            }
        }
        if (foundDataPattern)
            break;
    }
    // 폴백: 두 번째 행의 패턴을 가진 행이 뒤에 없으면, 두 번째 행도 헤더행으로 간주 (즉, 세 번째 행을 데이터 시작 행으로 설정)
    if (!foundDataPattern) {
        dataStartRow = Math.min(scanStart + 2, rows.length - 1);
        recordHeight = 1;
        console.log(`[detectDataArea] No pattern found. Fallback dataStartRow to ${dataStartRow}`);
    }
    // STEP 3. 데이터 시작 행이 scanStart와 동일하다면 헤더가 전혀 없는 상태이므로 합성 헤더 제공
    if (dataStartRow === scanStart) {
        const colCount = (0, exports.rowToValues)(rows[scanStart]).length;
        const syntheticHeaderNames = Array.from({ length: colCount }, (_, i) => `컬럼${i + 1}`);
        console.log("[detectDataArea] dataStartRow equals scanStart. Synthetic header generated.");
        console.log("=== [detectDataArea] Scan End ===");
        return { dataStartRow, recordHeight, syntheticHeaderNames };
    }
    // 정상적으로 실제 헤더가 감지된 경우 (scanStart부터 dataStartRow - 1까지가 헤더 영역)
    console.log(`[detectDataArea] Final result -> dataStartRow: ${dataStartRow}, recordHeight: ${recordHeight}`);
    console.log("=== [detectDataArea] Scan End ===");
    return { dataStartRow, recordHeight, syntheticHeaderNames: null };
};
exports.detectDataArea = detectDataArea;
exports.useExcelStore = (0, zustand_1.create)((set, get) => ({
    file: null,
    fileKey: null,
    fileInfo: null,
    allData: [],
    allOriginalData: [],
    totalCount: 0,
    loadedChunks: new Set(),
    uploadProgress: 0,
    isUploading: false,
    page: 1,
    mappingResult: null,
    selectedHeaderCells: new Set(),
    mode: null,
    selectedHeaderRows: new Set(),
    selectedSampleRows: new Set(),
    selectedEtcRows: new Set(),
    headerBaseRow: 0,
    sampleBaseRow: 0,
    etcBaseRow: 0,
    headerHeight: 0,
    recordHeight: 0,
    etcHeight: 0,
    // 백엔드에서 받아온 매핑 대상 컬럼
    targetColumns: [],
    isMappingConfirmed: false,
    isAnalysisDone: false,
    wasInitialFullMapping: false,
    startColIndex: 0,
    startRowIndex: 0,
    validationErrors: [],
    selectedSystemColumn: null,
    confirmMappingCompletion: () => {
        const allMapped = get().targetColumns.every((col) => col.excelColIndex !== null && col.excelColIndex !== undefined);
        if (allMapped) {
            set({ isMappingConfirmed: true });
        }
    },
    setIsMappingConfirmed: (isMappingConfirmed) => {
        if (isMappingConfirmed) {
            const allMapped = get().targetColumns.every((col) => col.excelColIndex !== null && col.excelColIndex !== undefined);
            if (!allMapped)
                return;
        }
        set({ isMappingConfirmed });
    },
    setTargetColumns: (columns) => set({ targetColumns: columns }),
    updateColumnMapping: (name, frontColumn, colIndex, relativeRowIndex) => set((prev) => {
        const nextTargetColumns = prev.targetColumns.map((col) => {
            // 1. 해당 시스템 컬럼의 매핑 정보를 업데이트
            if (col.name === name) {
                return { ...col, frontColumn, excelColIndex: colIndex, relativeRowIndex };
            }
            // 2. 다른 시스템 컬럼이 이미 이 위치(행, 열)에 매핑되어 있었다면 해제 (1:1 매핑 유지)
            if (frontColumn &&
                col.frontColumn === frontColumn &&
                col.excelColIndex === colIndex &&
                col.relativeRowIndex === relativeRowIndex) {
                return { ...col, frontColumn: null, excelColIndex: null, relativeRowIndex: null };
            }
            return col;
        });
        // 매핑이 변경되었으므로 자동 검증 트리거
        setTimeout(() => {
            get().handleConfirmMapping();
        }, 0);
        return { targetColumns: nextTargetColumns, isMappingConfirmed: false };
    }),
    setFile: (file) => {
        if (file) {
            set({
                file,
                fileKey: null, // 새 파일 업로드 시 이전 fileKey 반드시 초기화
                fileInfo: { name: file.name, size: file.size },
                allData: [],
                allOriginalData: [],
                totalCount: 0,
                loadedChunks: new Set(),
                page: 1,
                selectedHeaderRows: new Set(),
                selectedSampleRows: new Set(),
                selectedEtcRows: new Set(),
                selectedHeaderCells: new Set(),
                mode: null,
                mappingResult: null,
                headerBaseRow: 0,
                sampleBaseRow: 0,
                etcBaseRow: 0,
                headerHeight: 0,
                recordHeight: 0,
                etcHeight: 0,
                targetColumns: [],
                isMappingConfirmed: false,
                isAnalysisDone: false,
                wasInitialFullMapping: false,
                startColIndex: 0,
                startRowIndex: 0,
                validationErrors: [],
                selectedSystemColumn: null,
            });
        }
        else {
            get().resetAll();
        }
    },
    setMode: (mode) => {
        set((prev) => {
            const updates = { mode };
            if (mode === "HEADER") {
                updates.selectedHeaderRows = new Set();
                updates.selectedHeaderCells = new Set();
                updates.headerBaseRow = 0;
                updates.headerHeight = 0;
                updates.isAnalysisDone = false;
                updates.mappingResult = null;
            }
            else if (mode === "DATA") {
                updates.selectedSampleRows = new Set();
                updates.sampleBaseRow = 0;
                updates.recordHeight = 0;
                updates.isAnalysisDone = false;
                updates.mappingResult = null;
            }
            else if (mode === "ETC") {
                updates.selectedEtcRows = new Set();
                updates.etcBaseRow = 0;
                updates.etcHeight = 0;
                updates.isAnalysisDone = false;
                updates.mappingResult = null;
            }
            return updates;
        });
    },
    setPage: (page) => set({ page }),
    setMappingResult: (mappingResult) => set({ mappingResult }),
    resetSelection: () => {
        const { mode } = get();
        if (mode === "HEADER") {
            set({ selectedHeaderRows: new Set(), selectedHeaderCells: new Set() });
        }
        else if (mode === "DATA") {
            set({ selectedSampleRows: new Set() });
        }
        else if (mode === "ETC") {
            set({ selectedEtcRows: new Set() });
        }
    },
    resetAll: () => {
        set({
            file: null,
            fileInfo: null,
            allData: [],
            allOriginalData: [],
            totalCount: 0,
            loadedChunks: new Set(),
            uploadProgress: 0,
            isUploading: false,
            page: 1,
            mappingResult: null,
            selectedHeaderCells: new Set(),
            mode: null,
            selectedHeaderRows: new Set(),
            selectedSampleRows: new Set(),
            selectedEtcRows: new Set(),
            headerBaseRow: 0,
            sampleBaseRow: 0,
            etcBaseRow: 0,
            headerHeight: 0,
            recordHeight: 0,
            etcHeight: 0,
            targetColumns: [],
            isMappingConfirmed: false,
            isAnalysisDone: false,
            wasInitialFullMapping: false,
            startColIndex: 0,
            startRowIndex: 0,
            validationErrors: [],
            selectedSystemColumn: null,
        });
    },
    setSelectedSystemColumn: (col) => set({ selectedSystemColumn: col }),
    fetchChunk: async (chunkIndex, isInitial = false) => {
        const { loadedChunks, file } = get();
        if (loadedChunks.has(chunkIndex))
            return;
        if (!file)
            return;
        try {
            if (isInitial) {
                set({ isUploading: true, uploadProgress: 5 });
            }
            const formData = new FormData();
            formData.append("file", file);
            formData.append("sheetNo", "0");
            formData.append("page", (chunkIndex + 1).toString());
            formData.append("size", "15");
            const response = await axios_1.default.post("/api/common/upload-excel", formData, {
                onUploadProgress: (progressEvent) => {
                    if (isInitial && progressEvent.total) {
                        const percentCompleted = Math.round((progressEvent.loaded * 45) / progressEvent.total);
                        set({ uploadProgress: 5 + percentCompleted }); // 5% ~ 50%
                    }
                },
            });
            console.log("Chunk response:", response.data);
            if (response.data) {
                if (isInitial) {
                    set({ uploadProgress: 55 });
                    const backendFileKey = response.data.data?.uploadExcelKey || response.data.uploadExcelKey || response.data.fileKey || response.data.data?.fileKey || response.data.file_key || response.data.data?.file_key || null;
                    if (backendFileKey) {
                        set({ fileKey: backendFileKey });
                    }
                    // 첫 청크 로드 시 targetColumns가 서버 응답에 있다면 상태에 저장합니다.
                    const backendTargetColumns = response.data.targetColumns || response.data.data?.targetColumns;
                    if (backendTargetColumns) {
                        // 모든 frontColumn이 null이 아닌지 확인 (수정 모드 노출 여부 결정)
                        const allMapped = backendTargetColumns.length > 0 &&
                            backendTargetColumns.every((col) => col.frontColumn !== null && col.frontColumn !== undefined);
                        // 프론트에서 사용할 수 있도록 frontColumn, excelColIndex를 명시적으로 초기화 (이미 있으면 유지)
                        const initializedColumns = backendTargetColumns.map((col) => ({
                            ...col,
                            frontColumn: col.frontColumn || null,
                            excelColIndex: col.excelColIndex ?? null,
                            dataType: col.dataType ?? null,
                            regex: col.regex ?? null,
                        }));
                        set({
                            targetColumns: initializedColumns,
                            wasInitialFullMapping: allMapped,
                            isMappingConfirmed: allMapped,
                        });
                        // 자동 검증 실행: 매핑 정보가 있는 경우에만
                        if (allMapped) {
                            setTimeout(() => {
                                get().handleConfirmMapping();
                            }, 0);
                        }
                    }
                }
                const rawRows = response.data.dataList || response.data.data?.dataList || [];
                const totalRows = rawRows.length;
                // 원래 엑셀 시트에서의 절대 행 인덱스(0-based)를 보전
                const rawRowsWithIndex = rawRows.map((row, idx) => ({
                    ...row,
                    _originalRowIndex: row.rowIndex !== undefined && row.rowIndex !== null ? row.rowIndex : idx
                }));
                // 우선 데이터 시작 행을 파악하여 헤더 영역과 데이터 영역을 구분
                let absoluteDataStartRow = -1;
                if (isInitial) {
                    // 빈 행만 임시로 제거한 배열로 헤더 스캔 (검출 정확도 향상)
                    const autoDetected = (0, exports.detectDataArea)(rawRowsWithIndex);
                    absoluteDataStartRow = rawRowsWithIndex[autoDetected.dataStartRow]?._originalRowIndex ?? -1;
                }
                else {
                    absoluteDataStartRow = get().sampleBaseRow;
                }
                // 사용자의 필터링 규칙 적용: 헤더 영역이면 완전 빈 행만 삭제, 데이터 영역이면 노이즈 삭제(우측 편향)까지 적용
                const filteredRows = (0, exports.filterRows)(rawRowsWithIndex, absoluteDataStartRow);
                // 유효한 열 영역(Bounds) 감지
                const { left, right } = (0, exports.getActiveColumnBounds)(filteredRows);
                set({ startColIndex: left });
                // 유효한 행 영역(Bounds) 감지 및 잘라내기
                const { top, bottom } = (0, exports.getActiveRowBounds)(filteredRows);
                set({ startRowIndex: top });
                // 유효 행 영역만큼 데이터 슬라이싱
                const slicedRows = filteredRows.slice(top, bottom + 1);
                const sanitize = (val) => {
                    if (typeof val === "string" && /^\d+\.0$/.test(val)) {
                        return val.replace(/\.0$/, "");
                    }
                    return val;
                };
                let newRows = slicedRows.map((row, idx) => {
                    if (isInitial && idx % 100 === 0) {
                        set({ uploadProgress: 55 + Math.round((idx / totalRows) * 35) });
                    }
                    const sanitizedRow = { ...row };
                    Object.keys(sanitizedRow).forEach((key) => {
                        if (Array.isArray(sanitizedRow[key])) {
                            // 감지된 유효 영역 [left, right] 범위로 슬라이싱 수행
                            sanitizedRow[key] = sanitizedRow[key].slice(left, right + 1).map(sanitize);
                        }
                        else {
                            sanitizedRow[key] = sanitize(sanitizedRow[key]);
                        }
                    });
                    // 원래 엑셀 시트에서의 절대 행 인덱스(0-based)를 보존하여 주입
                    return {
                        ...sanitizedRow,
                        rowIndex: row._originalRowIndex
                    };
                });
                set((prev) => {
                    const nextChunks = new Set(prev.loadedChunks);
                    nextChunks.add(chunkIndex);
                    return {
                        allData: [...prev.allData, ...newRows],
                        allOriginalData: [...prev.allOriginalData, ...newRows.map((r) => ({ ...r }))],
                        totalCount: response.data.totalCount || response.data.data?.totalCount || 0,
                        loadedChunks: nextChunks,
                    };
                });
                if (isInitial) {
                    const { targetColumns, wasInitialFullMapping } = get();
                    const mappedColumns = targetColumns.filter((col) => col.frontColumn);
                    let isStructureSet = false;
                    if (mappedColumns.length > 0) {
                        const savedHeaderStructure = response.data.headerStructure || response.data.data?.headerStructure;
                        if (savedHeaderStructure) {
                            console.log("=== [fetchChunk] Saved Template Structure Loaded ===");
                            console.log("savedHeaderStructure:", savedHeaderStructure);
                            // 신규 자동 감지 결과를 미리 계산
                            const autoDetected = (0, exports.detectDataArea)(newRows);
                            // 백엔드에서 저장된 headerStructure를 함께 보내준 경우 (저장된 정보 우선 사용)
                            // top (행 슬라이스 오프셋)을 차감하여 슬라이스된 newRows 기준의 상대 좌표로 변환
                            // rowIndex가 일치하는 행을 newRows 내에서 찾아 상대 인덱스로 변환 (중간 행 삭제 대응)
                            const findIndexByRowIndex = (targetRowIndex, fallback) => {
                                if (targetRowIndex === undefined || targetRowIndex === null)
                                    return fallback;
                                const foundIdx = newRows.findIndex((r) => r.rowIndex === targetRowIndex);
                                return foundIdx !== -1 ? foundIdx : fallback;
                            };
                            let hBaseRow = findIndexByRowIndex(savedHeaderStructure.headerStartRow, 0);
                            let hEndRow = findIndexByRowIndex(savedHeaderStructure.headerEndRow, hBaseRow);
                            let sBaseRow = findIndexByRowIndex(savedHeaderStructure.dataStartRow, hEndRow + 1);
                            let sEndRow = findIndexByRowIndex(savedHeaderStructure.dataEndRow, sBaseRow);
                            // 복원 데이터 가드: 저장된 템플릿의 데이터 시작 행이 문자열 전용이거나, 자동 감지된 dataStartRow보다 앞에 있는 경우
                            // 구조 오염이나 오탐으로 간주하여 자동 감지 결과(autoDetected)로 보정
                            const checkRowIsStringOnly = (rowIdx) => {
                                if (rowIdx < 0 || rowIdx >= newRows.length)
                                    return false;
                                const sig = (0, exports.getSignature)(newRows[rowIdx]);
                                return (0, exports.isStringOnlyRow)(sig);
                            };
                            if (sBaseRow < autoDetected.dataStartRow || checkRowIsStringOnly(sBaseRow)) {
                                console.log(`[fetchChunk] Saved dataStartRow (relative idx ${sBaseRow}) is invalid (either string-only or before autoDetected ${autoDetected.dataStartRow}). Overriding with autoDetected dataStartRow: ${autoDetected.dataStartRow}`);
                                sBaseRow = autoDetected.dataStartRow;
                                sEndRow = sBaseRow + (autoDetected.recordHeight - 1);
                                hEndRow = Math.max(0, sBaseRow - 1);
                                hBaseRow = Math.min(hBaseRow, hEndRow);
                            }
                            const eBaseRow = findIndexByRowIndex(savedHeaderStructure.etcStartRow, 0);
                            const eEndRow = findIndexByRowIndex(savedHeaderStructure.etcEndRow, hBaseRow > 0 ? hBaseRow - 1 : -1);
                            const detectedHeaderRows = new Set();
                            for (let i = hBaseRow; i <= hEndRow; i++) {
                                detectedHeaderRows.add(i);
                            }
                            const hHeight = hEndRow - hBaseRow + 1;
                            // 하이브리드 매칭: 기본적으로 위치(Index)를 유지하되, 위치가 깨졌다면 이름(frontColumn)으로 폴백(Fallback)
                            for (let i = hBaseRow; i <= hEndRow; i++) {
                                if (i >= newRows.length)
                                    break;
                                const rowValues = (0, exports.rowToValues)(newRows[i]).map((v) => String(v || "").trim());
                                targetColumns.forEach((col) => {
                                    let resolvedIndex = col.excelColIndex !== null && col.excelColIndex !== undefined
                                        ? Math.max(0, col.excelColIndex - left)
                                        : null;
                                    if (col.frontColumn) {
                                        const expectedName = col.frontColumn.trim();
                                        if (resolvedIndex !== null && rowValues[resolvedIndex] !== expectedName) {
                                            const foundIdx = rowValues.indexOf(expectedName);
                                            if (foundIdx !== -1) {
                                                resolvedIndex = foundIdx;
                                                col.relativeRowIndex = i - hBaseRow;
                                            }
                                        }
                                        else if (resolvedIndex === null) {
                                            const foundIdx = rowValues.indexOf(expectedName);
                                            if (foundIdx !== -1) {
                                                resolvedIndex = foundIdx;
                                                col.relativeRowIndex = i - hBaseRow;
                                            }
                                        }
                                    }
                                    col.excelColIndex = resolvedIndex;
                                });
                            }
                            const detectedSampleRows = new Set();
                            if (sBaseRow < newRows.length) {
                                for (let i = sBaseRow; i <= sEndRow && i < newRows.length; i++) {
                                    detectedSampleRows.add(i);
                                }
                            }
                            const detectedEtcRows = new Set();
                            if (eEndRow >= eBaseRow) {
                                for (let i = eBaseRow; i <= eEndRow && i < newRows.length; i++) {
                                    detectedEtcRows.add(i);
                                }
                            }
                            set({
                                selectedHeaderRows: detectedHeaderRows,
                                headerBaseRow: hBaseRow,
                                headerHeight: hHeight,
                                selectedSampleRows: detectedSampleRows,
                                sampleBaseRow: detectedSampleRows.size > 0 ? sBaseRow : 0,
                                recordHeight: detectedSampleRows.size > 0 ? sEndRow - sBaseRow + 1 : 0,
                                selectedEtcRows: detectedEtcRows,
                                etcBaseRow: detectedEtcRows.size > 0 ? eBaseRow : 0,
                                etcHeight: detectedEtcRows.size > 0 ? eEndRow - eBaseRow + 1 : 0,
                                isMappingConfirmed: wasInitialFullMapping,
                                targetColumns: [...targetColumns],
                            });
                            isStructureSet = true;
                        }
                        else {
                            // ──────────────────────────────────────────────────────────────
                            // [저장된 매핑 없음] 노이즈 제거 → 헤더 자동 탐지 → recordHeight 결정
                            // 10행 안에 헤더가 없으면 합성 헤더 행을 newRows 앞에 삽입
                            // ──────────────────────────────────────────────────────────────
                            const { dataStartRow: rawDataStart, recordHeight: rh, syntheticHeaderNames } = (0, exports.detectDataArea)(newRows);
                            // 합성 헤더 처리: 헤더가 없는 경우 "컬럼1", "컬럼2"... 행을 데이터 앞에 삽입
                            let dataStartRow = rawDataStart;
                            if (syntheticHeaderNames !== null) {
                                const syntheticRow = {};
                                syntheticHeaderNames.forEach((name, i) => { syntheticRow[String(i)] = name; });
                                newRows = [syntheticRow, ...newRows];
                                dataStartRow = rawDataStart + 1; // 삽입으로 인해 모든 인덱스 +1
                                // allData·allOriginalData에도 합성 헤더 반영
                                set((prev) => ({
                                    allData: [syntheticRow, ...prev.allData],
                                    allOriginalData: [{ ...syntheticRow }, ...prev.allOriginalData],
                                }));
                            }
                            const detectedHeaderRows = new Set();
                            for (let i = 0; i < dataStartRow; i++)
                                detectedHeaderRows.add(i);
                            const hBaseRow = 0;
                            const hHeight = Math.max(detectedHeaderRows.size, 1);
                            const sBaseRow = dataStartRow;
                            // 헤더 내 frontColumn 이름으로 컬럼 매핑 시도
                            for (let i = hBaseRow; i < hBaseRow + hHeight && i < newRows.length; i++) {
                                const rowValues = (0, exports.rowToValues)(newRows[i]).map((v) => String(v || '').trim());
                                targetColumns.forEach((col) => {
                                    let resolvedIndex = col.excelColIndex !== null && col.excelColIndex !== undefined ? col.excelColIndex : null;
                                    if (col.frontColumn) {
                                        const expectedName = col.frontColumn.trim();
                                        if (resolvedIndex !== null && rowValues[resolvedIndex] !== expectedName) {
                                            const foundIdx = rowValues.indexOf(expectedName);
                                            if (foundIdx !== -1) {
                                                resolvedIndex = foundIdx;
                                                col.relativeRowIndex = i - hBaseRow;
                                            }
                                        }
                                        else if (resolvedIndex === null) {
                                            const foundIdx = rowValues.indexOf(expectedName);
                                            if (foundIdx !== -1) {
                                                resolvedIndex = foundIdx;
                                                col.relativeRowIndex = i - hBaseRow;
                                            }
                                        }
                                    }
                                    col.excelColIndex = resolvedIndex;
                                });
                            }
                            const detectedSampleRows = new Set();
                            for (let i = sBaseRow; i < sBaseRow + rh && i < newRows.length; i++)
                                detectedSampleRows.add(i);
                            set({
                                selectedHeaderRows: detectedHeaderRows,
                                headerBaseRow: hBaseRow,
                                headerHeight: hHeight,
                                selectedSampleRows: detectedSampleRows,
                                sampleBaseRow: sBaseRow,
                                recordHeight: rh,
                                selectedEtcRows: new Set(),
                                etcBaseRow: 0,
                                etcHeight: 0,
                                isMappingConfirmed: wasInitialFullMapping,
                                targetColumns: [...targetColumns],
                            });
                            isStructureSet = true;
                        }
                    }
                    // [매핑 정보도 없는 완전 최초] - 노이즈 제거 → 헤더 자동 탐지 → recordHeight 결정
                    if (!isStructureSet && newRows.length > 0) {
                        const { dataStartRow: rawDataStart, recordHeight: rh, syntheticHeaderNames } = (0, exports.detectDataArea)(newRows);
                        // 합성 헤더 처리: 헤더가 없는 경우 "컬럼1", "컬럼2"... 행을 데이터 앞에 삽입
                        let dataStartRow = rawDataStart;
                        if (syntheticHeaderNames !== null) {
                            const syntheticRow = {};
                            syntheticHeaderNames.forEach((name, i) => { syntheticRow[String(i)] = name; });
                            newRows = [syntheticRow, ...newRows];
                            dataStartRow = rawDataStart + 1; // 삽입으로 인해 모든 인덱스 +1
                            // allData·allOriginalData에도 합성 헤더 반영
                            set((prev) => ({
                                allData: [syntheticRow, ...prev.allData],
                                allOriginalData: [{ ...syntheticRow }, ...prev.allOriginalData],
                            }));
                        }
                        const defaultHeaderRows = new Set();
                        for (let i = 0; i < dataStartRow; i++)
                            defaultHeaderRows.add(i);
                        const defaultSampleRows = new Set();
                        for (let i = dataStartRow; i < dataStartRow + rh && i < newRows.length; i++)
                            defaultSampleRows.add(i);
                        set({
                            selectedHeaderRows: defaultHeaderRows,
                            headerBaseRow: 0,
                            headerHeight: Math.max(defaultHeaderRows.size, 1),
                            selectedSampleRows: defaultSampleRows,
                            sampleBaseRow: dataStartRow,
                            recordHeight: rh,
                            selectedEtcRows: new Set(),
                            etcBaseRow: 0,
                            etcHeight: 0,
                        });
                        isStructureSet = true;
                    }
                    // 구조가 설정되었다면 자동 구조 분석 수행
                    if (isStructureSet) {
                        setTimeout(() => {
                            get().handleConfirmMapping();
                        }, 0);
                    }
                    set({ uploadProgress: 100 });
                    setTimeout(() => {
                        set({ isUploading: false, uploadProgress: 0 });
                    }, 500);
                }
            }
        }
        catch (error) {
            console.error("Chunk fetch failed", error);
            alert(`업로드 실패: ${error.response?.data?.message || error.message}`);
            set({ isUploading: false, uploadProgress: 0 });
        }
    },
    handleUpload: () => {
        set({
            allData: [],
            allOriginalData: [],
            loadedChunks: new Set(),
            page: 1,
            fileKey: null,
            targetColumns: [],
        });
        get().fetchChunk(0, true);
    },
    setValidationErrors: (errors) => set({ validationErrors: errors }),
    handleValidateExcelData: async () => {
        const { fileKey, targetColumns, startColIndex, sampleBaseRow, fileInfo, headerBaseRow, allData } = get();
        if (!fileKey) {
            alert("파일 키(fileKey)가 없습니다. 엑셀 파일을 다시 업로드해 주세요.");
            return;
        }
        const columnMappings = targetColumns
            .filter((col) => col.excelColIndex !== null && col.excelColIndex !== undefined)
            .map((col) => ({
            "col-index": col.excelColIndex + startColIndex, // 화면상의 잘린 인덱스에 startColIndex를 더해 원본 엑셀 인덱스 복구
            "relative-row": col.relativeRowIndex ?? 0,
            "back-column": col.name,
        }));
        if (columnMappings.length === 0) {
            alert("매핑된 컬럼 정보가 없습니다.");
            return;
        }
        // 안전한 행 참조 및 원본 rowIndex(절대 인덱스) 추출 헬퍼
        const getAbsoluteRowIndex = (base, height, defaultVal) => {
            const idx = base + Math.max(0, height - 1);
            if (idx >= 0 && idx < allData.length) {
                return allData[idx].rowIndex ?? defaultVal;
            }
            return defaultVal;
        };
        const hStart = allData[headerBaseRow]?.rowIndex ?? 0;
        const hEnd = getAbsoluteRowIndex(headerBaseRow, get().headerHeight || 1, hStart);
        const dStart = allData[sampleBaseRow]?.rowIndex ?? (hEnd + 1);
        const dEnd = getAbsoluteRowIndex(sampleBaseRow, get().recordHeight || 1, dStart);
        // 1. 검증 전 템플릿(매핑 정보) 선 저장
        const templateData = {
            fileName: fileInfo?.name || "unknown",
            structures: {
                headerStartRow: hStart,
                headerEndRow: hEnd,
                dataStartRow: dStart,
                dataEndRow: dEnd,
            },
            targetColumns: targetColumns.map((col) => ({
                ...col,
                excelColIndex: col.excelColIndex !== null && col.excelColIndex !== undefined ? col.excelColIndex + startColIndex : null,
                relativeRowIndex: col.relativeRowIndex ?? 0
            })),
        };
        const savePayload = {
            fileId: fileKey || "",
            modifiedRows: [],
            mappedData: [],
            templateData: templateData
        };
        try {
            await axios_1.default.post("/api/common/save-excel-data-and-template", savePayload);
            console.log("Template saved successfully prior to validation.");
        }
        catch (err) {
            console.error("Save template failed", err);
            // 템플릿 저장이 실패하더라도 검증은 진행할 수 있도록 에러만 찍고 넘어갑니다.
        }
        // 2. 검증 진행
        const validatePayload = {
            file_key: fileKey || "",
            file_name: fileInfo?.name || "unknown",
            data_start_row: dStart,
            data_end_row: dEnd,
            columnMappings: columnMappings,
        };
        console.log("Validate Excel Payload:", validatePayload);
        axios_1.default
            .post("/api/common/validate-excel", validatePayload)
            .then((res) => {
            if (res.data?.data?.success || res.data?.success) {
                get().setValidationErrors([]);
                alert("매핑 정보 자동 저장 및 검증이 완료되었습니다! (저장 가능)");
            }
            else {
                const errors = res.data?.data?.errors || res.data?.errors || [];
                get().setValidationErrors(errors);
                console.log("에러 발생 목록:", errors);
                alert("매핑 정보는 저장되었으나, 유효성 검사에 실패한 항목이 있습니다. 빨간색으로 표시된 셀을 확인해주세요.");
            }
        })
            .catch((err) => {
            console.error("Validation failed", err);
            const errMsg = err.response?.data?.message || err.response?.data?.error || err.message;
            alert(`검증 요청 중 오류가 발생했습니다.\n상세: ${errMsg}`);
        });
    },
    handleRowClick: (rowIndex) => {
        const { mode } = get();
        if (mode === "HEADER") {
            set((prev) => {
                const next = new Set(prev.selectedHeaderRows);
                if (next.has(rowIndex)) {
                    next.delete(rowIndex);
                }
                else {
                    next.add(rowIndex);
                }
                const sorted = Array.from(next).sort((a, b) => a - b);
                const newHeaderBaseRow = sorted.length > 0 ? sorted[0] : prev.headerBaseRow;
                const newHeaderHeight = sorted.length > 0 ? sorted[sorted.length - 1] - sorted[0] + 1 : 0;
                const nextCells = new Set(prev.selectedHeaderCells);
                nextCells.forEach((id) => {
                    if (id.startsWith(`${rowIndex}-`))
                        nextCells.delete(id);
                });
                return {
                    selectedHeaderRows: next,
                    headerBaseRow: newHeaderBaseRow,
                    headerHeight: newHeaderHeight,
                    selectedHeaderCells: nextCells,
                };
            });
        }
        else if (mode === "DATA") {
            set((prev) => {
                const next = new Set(prev.selectedSampleRows);
                if (next.has(rowIndex))
                    next.delete(rowIndex);
                else
                    next.add(rowIndex);
                const sorted = Array.from(next).sort((a, b) => a - b);
                const newSampleBaseRow = sorted.length > 0 ? sorted[0] : prev.sampleBaseRow;
                const newRecordHeight = sorted.length > 0 ? sorted[sorted.length - 1] - sorted[0] + 1 : 0;
                return {
                    selectedSampleRows: next,
                    sampleBaseRow: newSampleBaseRow,
                    recordHeight: newRecordHeight,
                };
            });
        }
        else if (mode === "ETC") {
            set((prev) => {
                const next = new Set(prev.selectedEtcRows);
                if (next.has(rowIndex))
                    next.delete(rowIndex);
                else
                    next.add(rowIndex);
                const sorted = Array.from(next).sort((a, b) => a - b);
                const newEtcBaseRow = sorted.length > 0 ? sorted[0] : prev.etcBaseRow;
                const newEtcHeight = sorted.length > 0 ? sorted[sorted.length - 1] - sorted[0] + 1 : 0;
                return {
                    selectedEtcRows: next,
                    etcBaseRow: newEtcBaseRow,
                    etcHeight: newEtcHeight,
                };
            });
        }
    },
    handleHeaderCellClick: (rowIndex, colIndex) => {
        const { mode } = get();
        if (mode !== "HEADER")
            return;
        const cellId = `${rowIndex}-${colIndex}`;
        set((prev) => {
            const next = new Set(prev.selectedHeaderCells);
            if (next.has(cellId)) {
                next.delete(cellId);
            }
            else {
                next.add(cellId);
            }
            return { selectedHeaderCells: next };
        });
    },
    handleConfirmMapping: () => {
        const { allData, selectedHeaderRows, selectedSampleRows, selectedEtcRows, headerBaseRow, sampleBaseRow, etcBaseRow, selectedHeaderCells, fileInfo, } = get();
        const headerRows = Array.from(selectedHeaderRows).map((idx) => (0, exports.rowToValues)(allData[idx]));
        const sampleRows = Array.from(selectedSampleRows).map((idx) => (0, exports.rowToValues)(allData[idx]));
        const etcRows = Array.from(selectedEtcRows).map((idx) => (0, exports.rowToValues)(allData[idx]));
        if (headerRows.length === 0 || sampleRows.length === 0) {
            alert("헤더 행과 데이터 행을 모두 선택해 주세요.");
            return;
        }
        const selectedHeadersValues = new Set(Array.from(selectedHeaderCells)
            .map((id) => {
            const [r, c] = id.split("-").map(Number);
            const row = allData[r];
            if (!row)
                return "";
            return String((0, exports.rowToValues)(row)[c] || "");
        })
            .filter((v) => v !== ""));
        const buildStructure = (rows, isHeader = false) => {
            if (rows.length === 0)
                return [];
            const colCount = rows[0].length;
            const result = [];
            for (let col = 0; col < colCount; col++) {
                const colValues = rows.map((row, rowIndex) => {
                    const val = row[col];
                    return val === undefined || val === null ? "" : String(val).trim();
                });
                result.push(colValues);
            }
            return result;
        };
        const headersMatrix = buildStructure(headerRows, true);
        const dataMatrix = buildStructure(sampleRows, false);
        const etcMatrix = buildStructure(etcRows, false);
        const getStructuredData = (matrix, startRow) => {
            const colCount = matrix.length;
            const rowCount = matrix[0]?.length || 0;
            const results = [];
            const visited = new Set();
            for (let c = 0; c < colCount; c++) {
                for (let r = 0; r < rowCount; r++) {
                    if (visited.has(`${c},${r}`))
                        continue;
                    const value = matrix[c][r];
                    if (value !== "" && value !== null) {
                        const cell = { value: value.trim(), row: r + startRow, col: c };
                        let rowSpan = 1;
                        for (let j = r + 1; j < rowCount; j++) {
                            if (matrix[c][j] === "") {
                                rowSpan++;
                                visited.add(`${c},${j}`);
                            }
                            else
                                break;
                        }
                        if (rowSpan > 1)
                            cell.rowspan = rowSpan;
                        let colSpan = 1;
                        for (let i = c + 1; i < colCount; i++) {
                            if (matrix[i][r] === "") {
                                colSpan++;
                                visited.add(`${i},${r}`);
                            }
                            else
                                break;
                        }
                        if (colSpan > 1)
                            cell.colspan = colSpan;
                        results.push(cell);
                    }
                }
            }
            return results;
        };
        const getStructuredType = (matrix, startRow) => {
            const colCount = matrix.length;
            const rowCount = matrix[0]?.length || 0;
            const cellMap = new Map();
            const getDataTypeAndPattern = (val) => {
                let type = "string";
                let pattern = undefined;
                if (/^\d+(\.\d+)?$/.test(val.replace(/[\s,]/g, ""))) {
                    type = "number";
                }
                else if (/^\d{3}-\d{3,4}-\d{4}$/.test(val)) {
                    type = "phone";
                    pattern = "^\\d{3}-\\d{3,4}-\\d{4}$";
                }
                else if (/^\d{3}-\d{2}-\d{5}$/.test(val)) {
                    type = "biz-number";
                    pattern = "^\\d{3}-\\d{2}-\\d{5}$";
                }
                return { type, pattern };
            };
            for (let c = 0; c < colCount; c++) {
                for (let r = 0; r < rowCount; r++) {
                    const val = matrix[c][r];
                    if (cellMap.has(`${c},${r}`))
                        continue;
                    if (val !== "") {
                        const { type, pattern } = getDataTypeAndPattern(val);
                        const cell = { type, row: r + startRow, col: c };
                        if (pattern)
                            cell.pattern = pattern;
                        let rowSpan = 1;
                        for (let j = r + 1; j < rowCount; j++) {
                            if (matrix[c][j] === "") {
                                rowSpan++;
                                cellMap.set(`${c},${j}`, { type: "", row: j + startRow, col: c });
                            }
                            else
                                break;
                        }
                        if (rowSpan > 1)
                            cell.rowspan = rowSpan;
                        let colSpan = 1;
                        for (let i = c + 1; i < colCount; i++) {
                            if (matrix[i][r] === "") {
                                colSpan++;
                                cellMap.set(`${i},${r}`, { type: "", row: r + startRow, col: i });
                            }
                            else
                                break;
                        }
                        if (colSpan > 1)
                            cell.colspan = colSpan;
                        cellMap.set(`${c},${r}`, cell);
                    }
                }
            }
            return Array.from(cellMap.values()).filter((cell) => cell.type !== "");
        };
        function mergeHeaderAndType(headers, types) {
            const mergedList = [];
            const cols = new Set([...headers.map((h) => h.col), ...types.map((t) => t.col)]);
            cols.forEach((col) => {
                const colHeaders = headers.filter((h) => h.col === col);
                const colTypes = types.filter((t) => t.col === col);
                if (colTypes.length > 0) {
                    colTypes.forEach((typeInfo) => {
                        const relativeRow = typeInfo.row - sampleBaseRow;
                        const matchedHeader = colHeaders.find((h) => h.row - headerBaseRow === relativeRow) ||
                            colHeaders[0] || { value: "" };
                        const { value, ...restHeader } = matchedHeader;
                        const merged = {
                            column: value,
                            ...restHeader,
                            type: typeInfo.type,
                            row: typeInfo.row,
                            col: col,
                        };
                        if (typeInfo.pattern)
                            merged.pattern = typeInfo.pattern;
                        if (typeInfo.rowspan)
                            merged.rowspan = typeInfo.rowspan;
                        if (typeInfo.colspan)
                            merged.colspan = typeInfo.colspan;
                        mergedList.push(merged);
                    });
                }
                else {
                    const header = colHeaders.length > 0 ? colHeaders[0] : { value: "" };
                    const { value, ...restHeader } = header;
                    const merged = {
                        column: value,
                        ...restHeader,
                        type: "string",
                        row: sampleBaseRow,
                        col: col,
                    };
                    mergedList.push(merged);
                }
            });
            return mergedList;
        }
        const structuredHeaders = getStructuredData(headersMatrix, headerBaseRow);
        const filteredStructuredHeaders = structuredHeaders.filter((h) => !selectedHeadersValues.has(h.value));
        const structuredData = getStructuredData(dataMatrix, sampleBaseRow);
        const transformStructuredData = mergeHeaderAndType([...filteredStructuredHeaders].sort((a, b) => a.row - b.row || a.col - b.col), getStructuredType(dataMatrix, sampleBaseRow).sort((a, b) => a.row - b.row || a.col - b.col));
        console.log("헤더 행 데이터 :", structuredHeaders);
        console.log("데이터 행 데이터:", structuredData);
        console.log("변환된 구조 타입 데이터 (필터링됨):", transformStructuredData);
        const headerHeight = headerRows.length;
        const recordHeight = sampleRows.length;
        const etcHeight = etcRows.length;
        // const flattenedEtc = getStructuredData(etcMatrix, etcBaseRow)
        set({
            headerHeight,
            recordHeight,
            etcHeight,
            mappingResult: {
                headersMatrix,
                dataMatrix,
                etcMatrix,
                headerHeight,
                recordHeight,
                etcHeight,
                // flattenedHeaders: structuredHeaders,
                flattenedData: transformStructuredData,
                // flattenedEtc,
            },
            mode: null,
            isAnalysisDone: true,
        });
        console.log("filename", fileInfo?.name);
        // axios.post("/api/common/analyze-excel-structure", {
        //   fileName: fileInfo?.name,
        // })
    },
    handleCellEdit: (rowIndex, colIndex, newValue) => {
        set((prev) => {
            const list = [...prev.allData];
            // Ensure the row exists. If not, create it and any necessary intermediate rows.
            if (rowIndex >= list.length) {
                const firstRow = list[0] || {};
                const key = Object.keys(firstRow).find((k) => Array.isArray(firstRow[k]));
                const colCount = key ? firstRow[key].length : Object.keys(firstRow).length;
                for (let i = list.length; i <= rowIndex; i++) {
                    const newRow = {};
                    if (key) {
                        newRow[key] = Array(colCount).fill("");
                    }
                    else {
                        // If not array-based, try to follow the structure of existing rows
                        Object.keys(firstRow).forEach((k) => (newRow[k] = ""));
                    }
                    list[i] = newRow;
                }
            }
            const row = { ...list[rowIndex] };
            const key = Object.keys(row).find((k) => Array.isArray(row[k]));
            if (key) {
                row[key] = [...row[key]];
                row[key][colIndex] = newValue;
            }
            else {
                const keys = Object.keys(row);
                row[keys[colIndex]] = newValue;
            }
            list[rowIndex] = row;
            // 셀 수정 시 자동 검증 트리거
            setTimeout(() => {
                get().handleConfirmMapping();
            }, 0);
            return {
                allData: list,
                totalCount: Math.max(prev.totalCount, list.length),
            };
        });
    },
}));
