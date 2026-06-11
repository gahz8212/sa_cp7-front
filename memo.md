# 엑셀 업로드 구조 해석 및 검증 로직 정리

본 문서는 `apps/admin/app/test/excel-upload/page.tsx`에 구현된 엑셀 구조 해석 로직의 핵심 원리와 구조를 정리합니다.

## 1. 주요 기능 및 성능 최적화
- **영역별 행 위치 관리**: '헤더', '데이터', '기타' 영역별로 독립적인 `useRef`(`headerBaseRowRef`, `sampleBaseRowRef`, `etcBaseRowRef`)를 사용하여, 데이터가 시작되는 실제 엑셀 행 번호를 정확히 추적합니다.
- **성능 최적화 (대용량 데이터 대응)**:
    - **O(1) 검색 (Map/Set)**: `mappingResult` 스키마 검색 시 `Map`을 사용하고, 선택 상태 관리에 `Set`을 도입하여 대용량 데이터(1000개 이상)에서도 렌더링 지연을 최소화했습니다.
    - **가상화 효과 (Paging)**: `pageSize` 기반 페이징과 검색 최적화를 결합하여 `Input` 컴포넌트의 부하를 관리합니다.
    - **안전한 데이터 복사**: `structuredClone` 대신 안전하고 빠른 얕은 복사(`map`)를 사용하여 브라우저 호환성과 속도를 동시에 확보했습니다.
- **진행률 표시 (Progress Bar)**:
    - **Axios Hook 연동**: `onUploadProgress`를 통해 서버 전송 상태(0~50%)를 실시간으로 표시합니다.
    - **가공 진행률**: 서버 수신 후 프론트엔드 데이터 정규화 과정을 단계별(50~100%)로 시각화하여 사용자 경험을 개선했습니다.
- **병합(rowspan/colspan) 처리**: `getStructuredData` 및 `getStructuredType` 함수에서 빈 셀을 확인하여 엑셀의 병합 구조를 계산하고, 최종 데이터에 `rowspan`과 `colspan` 속성을 포함합니다.

## 2. 핵심 로직 구조
- `handleRowClick`: 각 모드(HEADER, DATA, ETC)별로 행 선택 시 해당 영역의 `BaseRowRef`를 선택된 행 중 가장 첫 번째 행 번호로 업데이트합니다.
- `getStructuredData` / `getStructuredType`: 엑셀 매트릭스를 순회하며 실제 데이터를 추출하고 병합 구조(`rowspan`, `colspan`)를 계산합니다.
- `mergeHeaderAndType`: 헤더 컬럼 정보와 타입 정보(병합 정보 포함)를 결합하여 최종 스키마를 생성합니다.
- `renderTable`: 페이지 이동 시에도 `mappingResult`의 스키마를 바탕으로 모든 셀의 유효성을 실시간으로 검사합니다.

## 3. UI 구성
- **구조 해석 결과**: `renderMappingTable` 함수를 통해 해석된 헤더 및 데이터 영역의 병합 구조를 시각적으로 미리 확인할 수 있습니다. 이때 원본 행렬(Matrix) 데이터를 사용하여 정확한 테이블 레이아웃을 보장합니다.

## 4. 주의사항
- 헤더, 데이터, 기타 영역 선택 시, 각 데이터가 시작되는 행을 정확히 선택해야 정확한 좌표(`row`)가 계산됩니다.
- 검증 로직은 데이터 영역 시작점 이후부터만 작동하므로 헤더 영역의 명칭에 의한 오검증이 발생하지 않습니다.
