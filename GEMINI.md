# 📜 CleanPay7 프로젝트 가이드 및 학습 기록

이 파일은 팀 전체가 공유하는 프로젝트 아키텍처 가이드이자, 주요 기술 결정 사항을 기록하는 문서입니다.

## 🏗 프로젝트 핵심 아키텍처
### 1. UI 컴포넌트 설계 (Atomic Design)
- **파일 구성**: 각 컴포넌트는 `index.tsx`(로직), `types.ts`(명세), `ComponentName.tsx` 또는 `Toolbar.tsx`(UI)로 분리하여 관리합니다.
- **Storefront 패턴**: 외부에서는 `index.tsx`를 통해서만 컴포넌트와 핵심 타입을 가져오도록 설계하여 내부 구조를 캡슐화합니다.

### 2. 주요 기술 스택 및 패턴
- **Framework**: Next.js 16 (App Router), React 19, Tailwind CSS v4
- **Ref Handling**: `forwardRef`를 사용하여 부모-자식 간의 직접적인 통신 통로를 확보합니다.
- **Optimization**: `useCallback`과 `useRef`를 조합하여 참조 무결성을 유지하고 불필요한 리렌더링 및 초기화를 방지합니다.
- **Resource Management**: `useImperativeHandle`을 통해 에디터 내부의 고립된 자원(이미지 등)을 추적하고 관리합니다.

## 📝 주요 학습 기록 (2026-05-26)
- **RichEditor 분석**: Tiptap 기반의 에디터에서 발생할 수 있는 무한 루프 방지 로직(`isInternalChange`)과 가비지 컬렉션(`getOrphanedImages`) 원리 파악.
- **Hydration Issue**: `rhwp`와 같은 브라우저 확장 프로그램이 DOM을 조작할 때 발생하는 Next.js 하이드레이션 오류의 원인 및 `suppressHydrationWarning` 해결책 논의.
- **환경 이슈**: `Slow filesystem` 경고 대응 및 `node_modules/.bin` 권한 부여 방법 확인.

## 📋 향후 작업 및 검증 과제
- [ ] `apps/admin/app/page.tsx`에 실습용 에디터 페이지 적용 및 테스트.
- [ ] 세션 타이머(`test/timer`)의 실제 인증 연동 및 탭 간 동기화 최종 확인.
- [ ] 하이드레이션 오류 방지를 위한 `layout.tsx` 수정 검토.
