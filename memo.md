# 엑셀 업로드 구조 해석 및 검증 로직 정리

본 문서는 `apps/admin/app/test/excel-upload/page.tsx`에 구현된 엑셀 구조 해석 로직의 핵심 원리와 구조를 정리합니다.

## 1. 주요 기능
- **영역별 행 위치 관리**: '헤더', '데이터', '기타' 영역별로 독립적인 `useRef`(`headerBaseRowRef`, `sampleBaseRowRef`, `etcBaseRowRef`)를 사용하여, 데이터가 시작되는 실제 엑셀 행 번호를 정확히 추적합니다.
- **1:1 데이터 추출**: 복잡한 병합(rowspan/colspan) 계산 로직을 제거하고, 엑셀 원본의 1x1 셀 구조를 그대로 보존하는 단순화된 추출 방식을 채택했습니다.
- **정확한 좌표 계산**: 데이터 추출 함수(`getStructuredData`, `getStructuredType`)는 `startRow` 파라미터를 사용하여, 결과 데이터의 `row` 속성에 실제 엑셀 시트상의 행 번호(`r + startRow`)를 정확히 반영합니다.
- **데이터 타입 검증**: 추출된 데이터를 기반으로 `number`, `phone`, `biz-number` 등의 타입을 추론하고, 타입 불일치 시 UI상에서 셀을 적색 테두리(`border-red-500`)로 표시합니다.

## 2. 핵심 로직 구조
- `handleRowClick`: 각 모드(HEADER, DATA, ETC)별로 행 선택 시 해당 영역의 `BaseRowRef`를 선택된 행 중 가장 첫 번째 행 번호로 업데이트합니다.
- `getStructuredData` / `getStructuredType`: 엑셀 매트릭스를 순회하며 빈 셀을 제외한 실제 데이터를 1:1로 추출합니다. 이때 `baseRow`를 더하여 정확한 엑셀 행 좌표를 계산합니다.
- `mergeHeaderAndType`: 헤더 컬럼 정보와 타입 정보를 결합하여 최종 스키마를 생성합니다.

## 3. 주의사항
- 헤더, 데이터, 기타 영역 선택 시, 각 데이터가 시작되는 행을 정확히 선택해야 정확한 좌표(`row`)가 계산됩니다.
- 본 로직은 병합 로직을 배제하여 엑셀 재생성 시 원본 구조를 그대로 유지하는 것에 최적화되어 있습니다.
