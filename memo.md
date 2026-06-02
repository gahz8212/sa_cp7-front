# 엑셀 업로드 및 그리드 편집 기능 구현 메모 (2026-06-02)

## 1. 개요
프론트엔드(Next.js)에서 엑셀 파일을 업로드하고, 백엔드(Spring Boot)로부터 분석된 데이터를 받아 그리드(Grid) 형태로 표시 및 수정하며, 페이지네이션을 통해 대량의 데이터를 확인하는 기능을 구현함.

## 2. 주요 해결 과제 및 조치 사항

### 2.1 포트 충돌 및 서버 실행
- **문제:** `npm run dev` 실행 시 3000번 포트가 이미 사용 중이라며 `EADDRINUSE` 에러 발생.
- **해결:** `ss -tunlp` 명령어로 3000번 포트를 점유 중인 `next-server` 프로세스(PID: 38375)를 확인 후 `kill -9`로 종료하고 서버 재시작.

### 2.2 CORS(Cross-Origin Resource Sharing) 해결
- **문제:** `localhost:3000`(프론트)에서 `localhost:8080`(백엔드)로 요청 시 브라우저 보안 정책에 의해 차단됨.
- **해결:** `next.config.ts`에 `rewrites` 설정을 추가하여 `/api/:path*` 요청을 `http://localhost:8080/api/:path*`로 프록시(Proxy) 처리함. 브라우저가 서버 대 서버 통신으로 인식하게 하여 CORS를 원천 차단함.

### 2.3 403 Forbidden 및 인증(Authentication) 에러
- **문제:** 요청 시 `403 Forbidden` 및 "접근 권한이 없습니다" 메시지 발생.
- **원인:** 
    1. 백엔드 Spring Security의 CSRF 필터가 브라우저의 POST 요청을 차단함.
    2. API 경로 오타 (`/api/upload/excel` -> `/api/common/upload-excel`).
- **해결:** 
    1. 백엔드 `SecurityConfig`에서 `csrf().disable()` 및 해당 경로 `permitAll()` 설정.
    2. 프론트엔드 API 경로를 백엔드 컨트롤러 주소와 일치하도록 수정.
    3. `axios` 호출 시 수동으로 넣었던 `Content-Type` 헤더를 제거하여 브라우저가 `multipart/form-data`의 `boundary`를 자동 설정하도록 함.

### 2.4 데이터 그리드(Table) 구현
- **UI:** 엑셀과 유사한 느낌을 위해 헤더 배경색을 노란색(`#FFFF00`)으로 설정하고 명확한 테두리 적용.
- **데이터 매핑:** 
    - `dataList`의 첫 번째 요소인 `rowType: 'HEADER'` 객체에서 컬럼명 배열을 추출하여 헤더로 사용.
    - 나머지 `rowType: 'DATA'` 요소들을 헤더 키와 매칭하여 9개의 셀에 가로로 배치.
- **편집 기능:** `input`의 `value`와 `onChange`를 연결하여 화면에서 수정한 값이 `data` 상태(State)에 실시간 반영되도록 `handleCellChange` 로직 구현.

### 2.5 페이지네이션(Pagination) 구현
- **백엔드 스펙:** 1페이지 시작, 페이지당 20개, 응답 필드 `totalCount`.
- **프론트 연동:** 
    - `page`, `size` 파라미터를 `formData`에 포함하여 요청.
    - 2페이지 이후 응답에 헤더 정보가 없더라도, 프론트엔드 상태(`headers`)에 저장된 정보를 사용하여 모든 페이지에서 헤더가 보이도록 '헤더 주입 로직' 적용.

## 3. 최종 코드 구조 (주요 포인트)
- **API URL:** `/api/common/upload-excel`
- **전송 데이터:** `file`, `rowNo`, `sheetNo`, `page`, `size`
- **상태 관리:** `data`(전체 응답), `page`(현재 번호), `headers`(추출된 헤더), `dataKey`(데이터 배열 키)

## 4. 향후 과제
- 페이지 이동 시 파일을 매번 재전송하는 방식 대신, `uploadExcelKey`를 활용한 조회 전용 API 연동 검토 필요.
- 수정된 전체 데이터를 서버로 다시 저장하는 기능 추가 필요.
