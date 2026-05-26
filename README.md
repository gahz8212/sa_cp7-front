# CleanPay7 Frontend

CleanPay7 서비스의 프론트엔드 모노레포입니다.

## 기술 스택

- **Framework**: Next.js 16, React 19
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS v4
- **Monorepo**: Turborepo + npm workspaces
- **패키지 매니저**: npm 10

## 프로젝트 구조

```
cp7-front/
├── apps/
│   ├── cp7/            # 대고객 서비스 (Next.js App Router)
│   ├── admin/          # 어드민 — cp7 제어 및 관리 (Next.js App Router)
│   └── watch/          # 신탁사/은행/연계관리 (Next.js App Router)
├── packages/
│   ├── ui/             # 공통 UI 컴포넌트 (@cp7/ui)
│   ├── core/           # 공통 로직/스토어/Provider (@cp7/core)
│   └── config/         # 공유 설정 tsconfig, tailwind, eslint (@cp7/config)
├── docs/               # 프로젝트 문서
├── turbo.json
└── package.json
```

## 개발 명령어

```bash
# 각 앱 개발 서버
npm run dev --workspace=apps/cp7
npm run dev --workspace=apps/admin
npm run dev --workspace=apps/watch

# 각 앱 빌드
npm run build --workspace=apps/cp7
npm run build --workspace=apps/admin
npm run build --workspace=apps/watch

# 전체 빌드
turbo build

# 특정 앱만 빌드
turbo build --filter=cp7
turbo build --filter=admin
turbo build --filter=watch
```

## 브랜치 전략

| 브랜치 | 용도 |
|--------|------|
| `main` | 기본 브랜치 |
| `dev`  | 개발 환경 |
| `prd`  | 운영 환경 |

## 문서

- [아키텍처](./docs/architecture.md)
- [멀티 도메인 설계](./docs/architecture-multi-domain.md)
- [UI 컴포넌트](./docs/ui-components.md)
- [API 클라이언트](./docs/api-client.md)
- [Date 컴포넌트](./docs/date-range-picker.md)
- [SessionTimer](./docs/session-timer.md)
- [프린트/PDF](./docs/print-pdf-context.md)
- [에셋 전략](./docs/assets-strategy.md)
