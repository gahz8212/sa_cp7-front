# 멀티 도메인 서비스 아키텍처 제안

> 작성일: 2026-04-06
> 배경: admin, dashboard, cleanpay 등 복수의 도메인 서비스를 단일 레포에서 개발하되, **빌드 결과물은 각 도메인별로 분리**하는 구조 검토

---

## 요구사항

- 도메인별 독립 빌드 (`admin`, `dashboard`, `cleanpay` 등)
- 공유 컴포넌트 및 유틸리티 코드 재사용
- 향후 도메인 추가가 용이한 확장 가능한 구조

---

## 옵션 비교

### ✅ Option 1: Turborepo 모노레포 (권장)

```
cp7-front/                   ← workspace root
├── apps/
│   ├── admin/               ← 독립 Next.js 앱
│   │   ├── app/
│   │   ├── next.config.ts
│   │   └── package.json
│   ├── dashboard/
│   │   ├── app/
│   │   ├── next.config.ts
│   │   └── package.json
│   └── cleanpay/
│       ├── app/
│       ├── next.config.ts
│       └── package.json
├── packages/
│   ├── ui/                  ← 공유 컴포넌트 (현재 components/)
│   ├── common/              ← 공유 유틸/훅/타입 (현재 common/)
│   └── config/              ← 공유 tsconfig, tailwind, eslint 설정
├── turbo.json
└── package.json             ← workspaces 설정
```

**빌드 명령어:**

```bash
turbo build --filter=admin      # admin만 빌드
turbo build --filter=dashboard  # dashboard만 빌드
turbo build --filter=cleanpay   # cleanpay만 빌드
turbo build                     # 전체 빌드 (변경분만 캐시 활용)
```

**장점**
- 도메인별 완전한 빌드 분리 및 독립 배포
- Turborepo 캐싱으로 변경된 앱/패키지만 재빌드
- 공유 패키지(`packages/`)를 내부 npm 패키지처럼 참조 가능
- CI/CD 파이프라인 최적화 용이

**단점**
- 초기 세팅 비용 존재 (turbo.json, 워크스페이스 설정 등)
- 패키지 간 의존성 관리 필요

---

### Option 2: npm Workspaces (Turborepo 없는 단순 방식)

```
cp7-front/
├── apps/
│   ├── admin/               ← 독립 Next.js 앱
│   ├── dashboard/
│   └── cleanpay/
├── shared/                  ← 공유 코드 (npm 패키지가 아닌 경로 alias)
│   ├── components/
│   └── common/
└── package.json             ← npm workspaces 설정만 사용
```

**빌드 명령어:**

```bash
npm run build -w apps/admin
npm run build -w apps/dashboard
```

**장점**
- Turborepo보다 단순한 설정
- npm 기본 기능만 사용

**단점**
- 빌드 캐싱 없음 (매번 전체 재빌드)
- 병렬 빌드 최적화 없음

---

### ❌ Option 3: 환경변수 기반 빌드 분기 (비권장)

```bash
NEXT_PUBLIC_APP=admin npm run build
NEXT_PUBLIC_APP=dashboard npm run build
```

같은 코드베이스를 환경변수로 필터링해 빌드.

**단점**
- 진정한 빌드 분리가 아님 (단일 Next.js 앱)
- 도메인 간 코드가 빌드 결과물에 혼재될 수 있음
- 확장성 낮음

---

## 최종 권장안: Option 1 (Turborepo 모노레포)

### 마이그레이션 방향

| 현재 | 이전 위치 |
|---|---|
| `components/` | `packages/ui/` |
| `common/` | `packages/common/` |
| `app/` | `apps/{domain}/app/` |
| `tsconfig.json`, `eslint.config.mjs` | `packages/config/` |

### 각 앱의 공유 패키지 참조 방식

```json
// apps/admin/package.json
{
  "dependencies": {
    "@cp7/ui": "*",
    "@cp7/common": "*"
  }
}
```

```ts
// apps/admin/app/page.tsx
import { Button } from '@cp7/ui'
import { useAuth } from '@cp7/common/hooks'
```

---

## 논의 필요 사항

- [ ] 도메인별 `.env` 파일 관리 전략 (현재 `.env.dev`, `.env.prd`)
- [ ] 공유 패키지 범위 결정 (어떤 컴포넌트/유틸을 `packages/`로 올릴 것인가)
- [ ] CI/CD 파이프라인: 도메인별 독립 배포 트리거 방식
- [ ] 패키지 네이밍 컨벤션 (`@cp7/ui`, `@cp7/common` 등)

---

## 도메인 전용 컴포넌트 및 유틸 구조

`packages/`에 올라가지 않는, 특정 도메인에서만 사용하는 컴포넌트와 유틸은 각 앱 디렉토리 내부에 동일한 컨벤션으로 유지한다.

### 위치 결정 원칙

| 범위 | 위치 |
|---|---|
| 2개 이상 도메인에서 사용 | `packages/ui`, `packages/common` |
| 1개 도메인에서만 사용 | `apps/{domain}/components/`, `apps/{domain}/common/` |

### 상세 구조

```
apps/
├── admin/
│   ├── app/                     ← Next.js App Router
│   ├── components/              ← admin 전용 컴포넌트
│   │   ├── atoms/
│   │   ├── molecules/
│   │   ├── organisms/
│   │   ├── templates/
│   │   └── providers/
│   ├── common/                  ← admin 전용 utils/hooks/types
│   │   ├── hooks/
│   │   ├── store/
│   │   ├── types/
│   │   └── utils/
│   ├── next.config.ts
│   └── package.json
│
├── dashboard/
│   ├── app/
│   ├── components/              ← dashboard 전용
│   ├── common/                  ← dashboard 전용
│   └── ...
│
└── cleanpay/
    ├── app/
    ├── components/              ← cleanpay 전용
    ├── common/                  ← cleanpay 전용
    └── ...
```

### 판단 기준 예시

```
Button, Input, Modal         → packages/ui          (모든 도메인에서 사용)
useAuth, useLocale           → packages/common      (모든 도메인에서 사용)

AdminSidebar                 → apps/admin/components/organisms/
AdminUserTable               → apps/admin/components/organisms/
useAdminPermission           → apps/admin/common/hooks/

CleanpayPaymentForm          → apps/cleanpay/components/organisms/
useCleanpayTransaction       → apps/cleanpay/common/hooks/
```

### 코드 참조 방식

```ts
// apps/admin/app/page.tsx

// 공통 패키지 참조
import { Button } from '@cp7/ui'
import { useLocale } from '@cp7/common/hooks'

// 도메인 내부 참조 (tsconfig paths의 @/ alias 사용)
import { AdminSidebar } from '@/components/organisms'
import { useAdminPermission } from '@/common/hooks'
```

### 핵심 원칙

> **처음에는 `apps/{domain}/` 안에 두고, 두 번째 도메인에서 필요해지면 그때 `packages/`로 올린다.**

처음부터 공통화하면 과설계가 되고, 실제 재사용 여부를 확인한 뒤 올리는 것이 안전하다.
