# Assets 관리 전략 논의

> 작성일: 2026-04-10
> 논의 배경: 퍼블리셔가 이미지·SASS 파일을 직접 작업하는 구조에서, 협업 편의성과 브라우저 캐싱 문제 중 어느 쪽을 우선할지 결정이 필요함

---

## 공통 전제

- 퍼블리셔가 git에 직접 파일을 올림 (이미지, SASS 등)
- 도메인: admin, dashboard, cleanpay 등 멀티 도메인 구조
- 빌드 도구: Next.js (Turbopack)
- `public/` 폴더 파일은 URL 직접 서빙 → 파일명이 같으면 브라우저 캐시 유지
- `import`로 가져오는 파일은 빌드 시 content hash 자동 부여 → 캐시 자동 무효화

---

## 1안 — 도메인별 `public/` 폴더만 사용

### 구조

```
apps/
  admin/
    public/
      locale/        ← 다국어 JSON
      images/        ← admin 이미지
      fonts/         ← admin 폰트
  dashboard/
    public/
      images/
      fonts/
```

### 장점

- 퍼블리셔가 `public/` 하나만 알면 됨 — 진입장벽 낮음
- Next.js 기본 동작과 일치, 별도 설정 없음
- 파일 경로가 URL과 1:1 대응 (`/images/banner.png`)

### 단점

- 파일명이 같으면 브라우저 캐시 유지 → **배포 후 변경 반영 안 되는 문제 발생 가능**
- 도메인마다 `public/`이 분리되어 있어 공통 파일 중복 가능

### 캐시 문제 완화 방법 (1안 채택 시)

| 방법 | 설명 | 난이도 |
|---|---|---|
| 파일명 버전 관리 | `banner-v2.png` 직접 명명 | 낮음 (수동) |
| CDN Cache-Control | 인프라에서 `no-cache` 헤더 설정 | 중간 |
| Query string | `banner.png?v=20260410` | 낮음 (수동) |

### 적합한 상황

- 이미지 교체 빈도가 낮음
- CDN에서 캐시 제어 가능한 환경
- 퍼블리셔 git 숙련도가 높지 않음

---

## 2안 — `packages/assets` 단일 패키지

### 구조

```
packages/
  assets/              ← 퍼블리셔가 작업하는 유일한 에셋 진입점
    shared/            ← 2개 이상 도메인 공통
      images/
      fonts/
      icons/
    admin/             ← admin 전용
      images/
    dashboard/         ← dashboard 전용
      images/

apps/
  admin/
    public/
      locale/          ← 다국어 JSON만 (변경 빈도 낮음)
```

### 사용 방법

```ts
// 개발자 코드에서 import → 빌드 시 content hash 자동 부여
import banner from '@cp7/assets/admin/images/banner.png'
import logo from '@cp7/assets/shared/images/logo.png'
```

빌드 결과: `banner.a3f9b2.png` → URL이 바뀌어 캐시 자동 무효화

### 장점

- 캐시 버스팅 자동
- 퍼블리셔 작업 위치가 `packages/assets/` 하나로 통일
- 공통 에셋 중복 없이 관리 가능

### 단점

- 퍼블리셔가 `shared/`, `admin/` 구분을 이해해야 함
- 퍼블리셔가 파일 추가해도 개발자가 `import` 코드 수정 필요
- `packages/assets` 패키지 초기 설정 필요

### 적합한 상황

- 이미지 교체 빈도가 높음
- CDN 설정이 어려운 환경
- 퍼블리셔가 모노레포 구조를 어느 정도 이해하고 있음

---

## 3안 — 도메인별 `assets/` 분산 + `packages/ui/assets/` 공통

### 구조

```
apps/
  admin/
    assets/          ← admin 전용 (빌드 시 해시 자동)
      images/
      fonts/
    public/
      locale/        ← 다국어 JSON만
  dashboard/
    assets/          ← dashboard 전용
      images/
      fonts/
  cleanpay/
    assets/
      images/
      fonts/

packages/
  ui/
    assets/          ← 2개 이상 도메인 공통 에셋
      images/
      icons/
      fonts/
```

### 사용 방법

```ts
// admin 전용
import banner from '@/assets/images/banner.png'

// 공통
import logo from '@cp7/ui/assets/images/logo.png'
```

### 장점

- 캐시 버스팅 자동
- 도메인 에셋이 해당 앱 안에 위치 → 앱 삭제 시 에셋도 함께 정리됨
- 도메인 독립성 가장 높음

### 단점

- **퍼블리셔 입장에서 작업 위치가 도메인 수만큼 늘어남** — 위치 혼동 핵심 이슈
- 새 도메인 추가 시 퍼블리셔에게 구조 안내 필요
- 공통/전용 구분 기준을 팀 내에서 지속적으로 유지해야 함

### 적합한 상황

- 퍼블리셔가 도메인별로 담당자가 나뉘어 있는 경우
- 도메인 단위 독립 배포·삭제가 잦은 경우

---

## 비교 요약

| 항목 | 1안 (`public/` only) | 2안 (`packages/assets`) | 3안 (도메인별 `assets/`) |
|---|---|---|---|
| 캐시 버스팅 | 수동 대응 필요 | 자동 | 자동 |
| 퍼블리셔 진입장벽 | 낮음 | 중간 | 높음 |
| 파일 위치 혼동 | 낮음 | 중간 | 높음 |
| 공통 에셋 관리 | 도메인별 중복 가능 | 한 곳 (`packages/assets/shared/`) | 한 곳 (`packages/ui/assets/`) |
| 도메인 독립성 | 낮음 | 낮음 | 높음 |
| 초기 설정 비용 | 낮음 | 중간 | 낮음 |
| SASS 처리 | 별도 위치 필요 | 함께 관리 가능 | 함께 관리 가능 |

---

## 결정 시 고려 포인트

1. **이미지 교체 빈도** — 자주 바뀌면 2안 or 3안, 거의 안 바뀌면 1안
2. **CDN 설정 가능 여부** — CDN 캐시 제어 가능하면 1안으로도 충분
3. **퍼블리셔 협업 방식** — 단일 위치 선호하면 2안, 도메인별 담당자 분리면 3안
4. **도메인 독립성 중요도** — 도메인 단위 관리가 중요하면 3안

---

## 미결 사항

- [ ] SASS 파일 위치 전략 별도 논의 필요
- [ ] CDN 도입 여부 및 Cache-Control 헤더 설정 가능 여부 확인
- [ ] 퍼블리셔와 협업 프로세스 구체화 (PR 리뷰 포함 여부 등)
