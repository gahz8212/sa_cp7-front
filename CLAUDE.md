@AGENTS.md
## 기술 스택
- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS
- **Structure**: Root `app/` directory (No `src/` folder)
- **Branch Strategy**: dev(개발), prd(운영)

## TypeScript 규칙
- 모든 함수와 컴포넌트에는 명시적인 타입을 지정할 것.
- `any` 사용 금지, 필요시 `unknown` 사용.
- Interface보다는 `type` 키워드 선호 (또는 그 반대).
- API 응답 타입은 반드시 `types/` 폴더에 정의된 것을 참조할 것.

## 주요 명령어
- 개발 서버: `npm run dev`
- 빌드 테스트: `npm run build`
- 린트 체크: `npm run lint`