# 아키텍처 결정사항

## 구조: Turborepo 모노레포

```
cp7-front/                        ← workspace root
├── apps/
│   ├── admin/                    ← 독립 Next.js 앱 (구현 완료)
│   │   ├── app/
│   │   │   ├── layout.tsx        ← admin용 Provider 조합
│   │   │   ├── page.tsx
│   │   │   └── client.tsx
│   │   ├── components/           ← admin 전용 컴포넌트
│   │   │   ├── atoms/
│   │   │   ├── molecules/
│   │   │   ├── organisms/
│   │   │   ├── templates/
│   │   │   └── providers/        ← admin 전용 Provider
│   │   ├── common/               ← admin 전용 utils/hooks/types
│   │   │   ├── api/
│   │   │   ├── hooks/
│   │   │   ├── i18n/
│   │   │   ├── store/
│   │   │   ├── types/
│   │   │   └── utils/
│   │   ├── service/              ← API 서비스 레이어 (빈 폴더, 구성 예정)
│   │   ├── next.config.ts
│   │   └── package.json
│   ├── dashboard/                ← 미생성 (계획)
│   └── cleanpay/                 ← 미생성 (계획)
├── packages/
│   ├── ui/                       ← 공통 컴포넌트 + 공통 Provider
│   ├── common/                   ← 공통 utils/hooks/types
│   └── config/                   ← 공유 tsconfig, tailwind, eslint
├── turbo.json
└── package.json                  ← workspaces 설정
```

## 핵심 원칙

### 코드 위치 결정 기준
| 범위 | 위치 |
|---|---|
| 2개 이상 도메인에서 사용 | `packages/ui` 또는 `packages/common` |
| 1개 도메인에서만 사용 | `apps/{domain}/components/` 또는 `apps/{domain}/common/` |

> 처음에는 `apps/{domain}/` 안에 두고, 두 번째 도메인에서 필요해지면 `packages/`로 올린다.

### layout / page / client
- `layout.tsx`, `page.tsx`, `client.tsx` 는 각 서비스별로 독립 유지
- `layout.tsx`에서 공통 Provider(`@cp7/core`) + 도메인 전용 Provider 조합

### Provider 위치
- 공통 Provider → `packages/ui/providers/` 또는 `packages/core/providers/`
- 도메인 전용 Provider → `apps/{domain}/components/providers/`

### 빌드 명령어
```bash
turbo build --filter=admin      # admin만 빌드
turbo build --filter=dashboard  # dashboard만 빌드
turbo build --filter=cleanpay   # cleanpay만 빌드
turbo build                     # 전체 빌드
```

### 패키지 참조 방식
```ts
import { Button } from '@cp7/ui'                        // 공통 UI 패키지
import { useLocaleStore } from '@cp7/core'              // 공통 core 패키지
import { AdminSidebar } from '@/components/organisms'   // 도메인 내부 (@/ alias)
```

## 패키지 네이밍 컨벤션

| 패키지 | 이름 | 내용 |
|---|---|---|
| 공통 UI 컴포넌트 | `@cp7/ui` | 공통 atoms, molecules 등 |
| 공통 로직/스토어/providers | `@cp7/core` | useLoadingStore, usePopupStore, useLocaleStore, QueryProvider, GlobalProvider, LanguageProvider, LANG_TYPE 등 |
| 공유 설정 | `@cp7/config` | tsconfig, tailwind, eslint |

> `common` 대신 `core`를 선택한 이유: 도메인 내부에 `common/` 폴더가 존재하므로 충돌 방지
> 도메인 내부(`components/`, `common/`)와 패키지(`ui/`, `core/`, `config/`) 이름이 겹치지 않음

## 공유 패키지 범위 결정

### `packages/core`로 올라가는 것
- `types/common.ts` (LANG_TYPE)
- `store/useLoadingStore.ts`
- `store/usePopupStore.ts`
- `store/useLocaleStore.ts` (기존 useUserStore에서 locale 부분만 분리)
- `providers/QueryProvider`
- `providers/GlobalProvider`
- `providers/LanguageProvider`

### 각 도메인 내부에 유지
- `store/useUserStore.ts` — UserInfoType이 도메인별로 상이
- `i18n/index.ts` — locale 파일 import 경로가 도메인별 다름
- `public/locale/*.json` — 도메인별 번역 파일
- `providers/AuthProvider` — 도메인별 인증 로직

### 주의: PopupProvider 순환 의존성 방지
- `packages/core/providers/PopupProvider/index.tsx`에서 `usePopupStore`는
  `@cp7/core`가 아닌 상대 경로 `../../store/usePopupStore`로 import해야 함

### packages/core 구조 업데이트
```
packages/core/
  api/
    types.ts
    createApiClient.ts
  store/
    useLoadingStore.ts
    useLocaleStore.ts
    usePopupStore.ts
  providers/
    GlobalProvider/
    LanguageProvider/
    PopupProvider/
    QueryProvider/
  types/
    common.ts
```

## .env 관리 전략
- 도메인별 `apps/{domain}/.env.dev`, `apps/{domain}/.env.prd` 독립 관리
- 빌드 시 주입 방식은 인프라 결정 후 추가 논의

## CI/CD
- Turborepo `--filter` 기반으로 변경된 앱만 빌드/배포
- GitHub Actions 사용 예정
- 실제 배포 커맨드, secrets, 트리거 조건은 인프라 결정 후 확정

## 참고 문서
- `docs/architecture-multi-domain.md` — 옵션 비교 및 전체 설계 문서
