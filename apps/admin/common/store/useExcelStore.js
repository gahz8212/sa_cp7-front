"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useExcelStore = exports.detectDataArea = exports.filterRows = exports.getActiveRowBounds = exports.getActiveColumnBounds = exports.getSignature = exports.isStringOnlyRow = exports.getCellType = exports.rowToValues = void 0;
const zustand_1 = require("zustand");
const axios_1 = require("axios");
const excelUtils_1 = require("./excelUtils");
Object.defineProperty(exports, "rowToValues", { enumerable: true, get: function () { return excelUtils_1.rowToValues; } });
Object.defineProperty(exports, "getCellType", { enumerable: true, get: function () { return excelUtils_1.getCellType; } });
Object.defineProperty(exports, "isStringOnlyRow", { enumerable: true, get: function () { return excelUtils_1.isStringOnlyRow; } });
Object.defineProperty(exports, "getSignature", { enumerable: true, get: function () { return excelUtils_1.getSignature; } });
Object.defineProperty(exports, "getActiveColumnBounds", { enumerable: true, get: function () { return excelUtils_1.getActiveColumnBounds; } });
Object.defineProperty(exports, "getActiveRowBounds", { enumerable: true, get: function () { return excelUtils_1.getActiveRowBounds; } });
Object.defineProperty(exports, "filterRows", { enumerable: true, get: function () { return excelUtils_1.filterRows; } });
Object.defineProperty(exports, "detectDataArea", { enumerable: true, get: function () { return excelUtils_1.detectDataArea; } });
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
                let absoluteHeaderStartRow = -1;
                if (isInitial) {
                    // 빈 행만 임시로 제거한 배열로 헤더 스캔 (검출 정확도 향상)
                    const autoDetected = (0, excelUtils_1.detectDataArea)(rawRowsWithIndex);
                    absoluteDataStartRow = rawRowsWithIndex[autoDetected.dataStartRow]?._originalRowIndex ?? -1;
                    absoluteHeaderStartRow = rawRowsWithIndex[autoDetected.headerStartRow]?._originalRowIndex ?? -1;
                }
                else {
                    absoluteDataStartRow = get().sampleBaseRow;
                    absoluteHeaderStartRow = get().headerBaseRow;
                }
                // 사용자의 필터링 규칙 적용: 헤더 영역이면 완전 빈 행만 삭제, 데이터 영역이면 노이즈 삭제(우측 편향)까지 적용
                const filteredRows = (0, excelUtils_1.filterRows)(rawRowsWithIndex, absoluteDataStartRow, absoluteHeaderStartRow);
                // 유효한 열 영역(Bounds) 감지
                const { left, right } = (0, excelUtils_1.getActiveColumnBounds)(filteredRows);
                set({ startColIndex: left });
                // 유효한 행 영역(Bounds) 감지 및 잘라내기
                const { top, bottom } = (0, excelUtils_1.getActiveRowBounds)(filteredRows);
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
                            const autoDetected = (0, excelUtils_1.detectDataArea)(newRows);
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
                                const sig = (0, excelUtils_1.getSignature)(newRows[rowIdx]);
                                return (0, excelUtils_1.isStringOnlyRow)(sig);
                            };
                            if (sBaseRow < autoDetected.dataStartRow || checkRowIsStringOnly(sBaseRow)) {
                                console.log(`[fetchChunk] Saved dataStartRow (relative idx ${sBaseRow}) is invalid (either string-only or before autoDetected ${autoDetected.dataStartRow}). Overriding with autoDetected dataStartRow: ${autoDetected.dataStartRow}`);
                                sBaseRow = autoDetected.dataStartRow;
                                sEndRow = sBaseRow + (autoDetected.recordHeight - 1);
                                hEndRow = Math.max(0, sBaseRow - 1);
                                hBaseRow = autoDetected.headerStartRow;
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
                                const rowValues = (0, excelUtils_1.rowToValues)(newRows[i]).map((v) => String(v || "").trim());
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
                            const { headerStartRow, dataStartRow: rawDataStart, recordHeight: rh, syntheticHeaderNames } = (0, excelUtils_1.detectDataArea)(newRows);
                            // 합성 헤더 처리: 헤더가 없는 경우 "컬럼1", "컬럼2"... 행을 데이터 앞에 삽입
                            let dataStartRow = rawDataStart;
                            let hBaseRow = headerStartRow;
                            if (syntheticHeaderNames !== null) {
                                const syntheticRow = {};
                                syntheticHeaderNames.forEach((name, i) => { syntheticRow[String(i)] = name; });
                                newRows = [syntheticRow, ...newRows];
                                dataStartRow = rawDataStart + 1; // 삽입으로 인해 모든 인덱스 +1
                                hBaseRow = 0; // 합성 헤더는 0번부터 시작
                                // allData·allOriginalData에도 합성 헤더 반영
                                set((prev) => ({
                                    allData: [syntheticRow, ...prev.allData],
                                    allOriginalData: [{ ...syntheticRow }, ...prev.allOriginalData],
                                }));
                            }
                            const detectedHeaderRows = new Set();
                            for (let i = hBaseRow; i < dataStartRow; i++)
                                detectedHeaderRows.add(i);
                            const hHeight = Math.max(detectedHeaderRows.size, 1);
                            const sBaseRow = dataStartRow;
                            // 헤더 내 frontColumn 이름으로 컬럼 매핑 시도
                            for (let i = hBaseRow; i < hBaseRow + hHeight && i < newRows.length; i++) {
                                const rowValues = (0, excelUtils_1.rowToValues)(newRows[i]).map((v) => String(v || '').trim());
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
                        const { headerStartRow, dataStartRow: rawDataStart, recordHeight: rh, syntheticHeaderNames } = (0, excelUtils_1.detectDataArea)(newRows);
                        // 합성 헤더 처리: 헤더가 없는 경우 "컬럼1", "컬럼2"... 행을 데이터 앞에 삽입
                        let dataStartRow = rawDataStart;
                        let hBaseRow = headerStartRow;
                        if (syntheticHeaderNames !== null) {
                            const syntheticRow = {};
                            syntheticHeaderNames.forEach((name, i) => { syntheticRow[String(i)] = name; });
                            newRows = [syntheticRow, ...newRows];
                            dataStartRow = rawDataStart + 1; // 삽입으로 인해 모든 인덱스 +1
                            hBaseRow = 0; // 합성 헤더는 0번부터 시작
                            // allData·allOriginalData에도 합성 헤더 반영
                            set((prev) => ({
                                allData: [syntheticRow, ...prev.allData],
                                allOriginalData: [{ ...syntheticRow }, ...prev.allOriginalData],
                            }));
                        }
                        const defaultHeaderRows = new Set();
                        for (let i = hBaseRow; i < dataStartRow; i++)
                            defaultHeaderRows.add(i);
                        const defaultSampleRows = new Set();
                        for (let i = dataStartRow; i < dataStartRow + rh && i < newRows.length; i++)
                            defaultSampleRows.add(i);
                        set({
                            selectedHeaderRows: defaultHeaderRows,
                            headerBaseRow: hBaseRow,
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
        // 자동화 전용 모드: 수동 클릭 비활성화
    },
    handleHeaderCellClick: (rowIndex, colIndex) => {
        // 자동화 전용 모드: 수동 클릭 비활성화
    },
    handleConfirmMapping: () => {
        const { allData, selectedHeaderRows, selectedSampleRows, selectedEtcRows, headerBaseRow, sampleBaseRow, etcBaseRow, selectedHeaderCells, fileInfo, } = get();
        const headerRows = Array.from(selectedHeaderRows).map((idx) => (0, excelUtils_1.rowToValues)(allData[idx]));
        const sampleRows = Array.from(selectedSampleRows).map((idx) => (0, excelUtils_1.rowToValues)(allData[idx]));
        const etcRows = Array.from(selectedEtcRows).map((idx) => (0, excelUtils_1.rowToValues)(allData[idx]));
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
            return String((0, excelUtils_1.rowToValues)(row)[c] || "");
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
