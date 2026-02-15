---
name: verify-build
description: 프런트엔드·백엔드 빌드 검증 BUILD-1~4. 소스 변경 후 타입 체크와 프로덕션 빌드가 에러 없이 통과하는지 확인.
---

# 빌드 검증

## Purpose

프런트엔드와 백엔드의 빌드 파이프라인이 에러 없이 통과하는지 검증합니다:

1. **프런트엔드 타입 체크** — `tsc --noEmit`으로 타입 에러 없음 확인
2. **프런트엔드 프로덕션 빌드** — `vite build`로 번들링 에러 없음 확인
3. **백엔드 타입 체크** — `tsc --noEmit`으로 타입 에러 없음 확인
4. **백엔드 컴파일** — `tsc`로 JavaScript 출력 에러 없음 확인

## When to Run

- `.ts`, `.tsx` 파일을 수정한 후
- `package.json` 의존성을 변경한 후
- `tsconfig*.json` 설정을 변경한 후
- `vite.config.ts`를 변경한 후
- 새로운 파일을 생성하거나 기존 파일을 삭제한 후
- 다른 verify 스킬의 수정 사항을 적용한 후 (최종 확인)

## Related Files

| File | Purpose |
|------|---------|
| `package.json` | 프런트엔드 빌드 스크립트 (`tsc -b && vite build`) |
| `server/package.json` | 백엔드 의존성 및 스크립트 |
| `tsconfig.json` | TypeScript 루트 설정 (references) |
| `tsconfig.app.json` | TypeScript 프런트엔드 설정 |
| `tsconfig.node.json` | TypeScript Node 설정 |
| `server/tsconfig.json` | TypeScript 백엔드 설정 |
| `vite.config.ts` | Vite 번들러 설정 |
| `src/**/*.ts` | 프런트엔드 소스 |
| `src/**/*.tsx` | 프런트엔드 컴포넌트 |
| `server/src/**/*.ts` | 백엔드 소스 |

## Workflow

### Step 1: 프런트엔드 타입 체크 (BUILD-1)

**디렉토리:** 프로젝트 루트

**실행:**

```bash
npx tsc --noEmit
```

- **PASS:** exit code 0, 에러 메시지 없음
- **FAIL:** exit code 1, 타입 에러 메시지 출력

**FAIL 시 수정:**
1. 에러 메시지에서 파일 경로와 라인 번호를 파싱
2. 해당 파일을 읽어 에러 원인 파악
3. 타입 선언 누락 → 타입 추가 또는 `.d.ts` 파일 생성
4. 타입 불일치 → 올바른 타입으로 수정
5. 미사용 import → import 제거

### Step 2: 프런트엔드 프로덕션 빌드 (BUILD-2)

**디렉토리:** 프로젝트 루트

**실행:**

```bash
npx vite build
```

- **PASS:** exit code 0, `dist/` 디렉토리에 번들 파일 생성
- **FAIL:** exit code 1, 빌드 에러 메시지 출력

**FAIL 시 수정:**
1. 구문 에러 (Unexpected token) → 해당 파일의 잔여/중복 코드 확인 및 제거
2. 모듈 해석 실패 → import 경로 수정 또는 누락 패키지 설치
3. JSX 에러 → 컴포넌트 구문 수정

### Step 3: 백엔드 타입 체크 (BUILD-3)

**디렉토리:** `server/`

**실행:**

```bash
cd server && npx tsc --noEmit
```

- **PASS:** exit code 0, 에러 메시지 없음
- **FAIL:** exit code 1, 타입 에러 메시지 출력

**FAIL 시 수정:**
1. 서드파티 타입 선언 누락 → `server/src/types/<module>.d.ts` 파일 생성
2. 타입 불일치 → 올바른 타입으로 수정
3. 모듈 import 에러 → `moduleResolution` 설정 확인

### Step 4: 백엔드 컴파일 (BUILD-4)

**디렉토리:** `server/`

**실행:**

```bash
cd server && npx tsc
```

- **PASS:** exit code 0, `server/dist/` 디렉토리에 `.js` 파일 생성
- **FAIL:** exit code 1, 컴파일 에러 메시지 출력

**FAIL 시 수정:**
1. Step 3에서 발견되지 않은 추가 에러가 있는 경우 → Step 3과 동일한 방법으로 수정
2. `outDir`/`rootDir` 설정 문제 → `server/tsconfig.json` 확인

## Output Format

```markdown
### verify-build 검증 결과

| # | 검사 | 대상 | 상태 |
|---|------|------|------|
| BUILD-1 | TypeScript 타입 체크 | 프런트엔드 | PASS / FAIL |
| BUILD-2 | Vite 프로덕션 빌드 | 프런트엔드 | PASS / FAIL |
| BUILD-3 | TypeScript 타입 체크 | 백엔드 | PASS / FAIL |
| BUILD-4 | TypeScript 컴파일 | 백엔드 | PASS / FAIL |

빌드 결과: 4/4 PASS ✅ (또는 X/4 PASS, Y FAIL)
```

## Exceptions

다음은 **문제가 아닙니다**:

1. **TypeScript 경고(Warning)** — 에러가 아닌 경고는 빌드 실패로 간주하지 않음
2. **ESLint 에러** — 빌드 검증은 타입 체크와 번들링만 다루며, 린트는 별도 영역
3. **테스트 실패** — 빌드 검증은 컴파일 가능 여부만 확인하며, 테스트 통과는 별도 영역
4. **개발 서버 기동 실패** — 런타임 에러는 빌드 에러와 구분됨 (포트 충돌, DB 연결 등)
5. **node_modules 미설치 상태** — `npm install`이 선행되어야 하며, 빌드 스킬 범위 밖
