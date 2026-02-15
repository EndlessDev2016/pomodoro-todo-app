---
name: verify-tech-stack
description: 아키텍처 원칙 A1-A8 검증. package.json, tsconfig, vite 설정, Zustand 스토어 변경 후 사용.
---

# 아키텍처 원칙 검증

## Purpose

프로젝트의 기술 스택이 합의된 아키텍처 원칙(A1-A8)을 준수하는지 검증합니다:

1. **프런트엔드 스택** — React + TypeScript + Vite + Zustand + dayjs
2. **백엔드 스택** — Node.js + Express + SQLite
3. **금지 라이브러리** — moment.js, date-fns 미사용
4. **TypeScript strict 모드** — 엄격한 타입 체크
5. **모노레포 구조** — 프런트/백 분리된 package.json

## When to Run

- `package.json` 또는 `server/package.json` 의 의존성 변경 후
- `tsconfig*.json` 설정 변경 후
- 새로운 라이브러리 도입 시
- 스토어 파일 추가/삭제 시

## Related Files

| File | Purpose |
|------|---------|
| `package.json` | 프런트엔드 의존성 |
| `server/package.json` | 백엔드 의존성 |
| `tsconfig.json` | TypeScript 루트 설정 |
| `tsconfig.app.json` | TypeScript 앱 설정 |
| `vite.config.ts` | Vite 번들러 설정 |
| `src/stores/todoStore.ts` | TODO 상태관리 스토어 |
| `src/stores/timerStore.ts` | 타이머 상태관리 스토어 |

## Workflow

### Step 1: 프런트엔드 필수 의존성 확인 (A1-A4)

**파일:** `package.json`

**검사:** 필수 패키지 존재 + 금지 패키지 부재

```bash
grep -c '"react"' package.json
grep -c '"zustand"' package.json
grep -c '"dayjs"' package.json
grep -c '"vite"' package.json
grep -c '"moment"' package.json
grep -c '"date-fns"' package.json
```

**PASS:** react, zustand, dayjs, vite가 존재하고 moment, date-fns가 0건
**FAIL:** 필수 패키지 누락 또는 금지 패키지 발견

**수정 방법:**
```bash
npm install zustand dayjs    # 누락 시
npm uninstall moment         # 금지 패키지 발견 시
```

### Step 2: TypeScript strict 모드 (A7)

**파일:** `tsconfig.json`, `tsconfig.app.json`

**검사:** strict 옵션 활성화 여부

```bash
grep -n '"strict"' tsconfig.json tsconfig.app.json
```

**PASS:** `"strict": true` 가 어느 하나에든 존재
**FAIL:** strict가 false이거나 없음

**수정 방법:** tsconfig.json에 `"strict": true` 추가

### Step 3: 백엔드 스택 확인 (A5-A6)

**파일:** `server/package.json`

**검사:** Express + SQLite 패키지 존재

```bash
grep -c '"express"' server/package.json
grep -E '"sql\.js"|"better-sqlite3"' server/package.json
```

**PASS:** express + (sql.js 또는 better-sqlite3) 존재
**FAIL:** 누락

### Step 4: 모노레포 구조 확인 (A8)

**검사:** 루트와 server에 각각 package.json 존재

```bash
test -f package.json && echo "ROOT OK"
test -f server/package.json && echo "SERVER OK"
```

**PASS:** 두 파일 모두 존재
**FAIL:** 어느 하나 누락

### Step 5: Zustand 스토어 분리 확인 (A3)

**파일:** `src/stores/`

**검사:** todoStore와 timerStore가 별도 파일로 존재

```bash
ls src/stores/todoStore.ts src/stores/timerStore.ts
```

**PASS:** 두 파일 모두 존재
**FAIL:** 누락되거나 하나의 파일에 합쳐져 있음

### Step 6: dayjs 사용 + 금지 라이브러리 미사용 확인 (A4)

**파일:** `src/**/*.ts`, `src/**/*.tsx`

**검사:** dayjs import 존재 + moment/date-fns import 부재

```bash
grep -r "from 'dayjs'" src/ --include="*.ts" --include="*.tsx"
grep -r "from 'moment'" src/ --include="*.ts" --include="*.tsx"
grep -r "from 'date-fns'" src/ --include="*.ts" --include="*.tsx"
```

**PASS:** dayjs 1건 이상 + moment/date-fns 0건
**FAIL:** dayjs 미사용 또는 금지 라이브러리 발견

## Output Format

```markdown
| Step | 검사 | 판정 | 비고 |
|------|------|------|------|
| 1 | 프런트 의존성 | PASS/FAIL | 상세 |
| 2 | TS strict | PASS/FAIL | 상세 |
| 3 | 백엔드 스택 | PASS/FAIL | 상세 |
| 4 | 모노레포 구조 | PASS/FAIL | 상세 |
| 5 | 스토어 분리 | PASS/FAIL | 상세 |
| 6 | dayjs/금지 lib | PASS/FAIL | 상세 |
```

## Exceptions

1. **node_modules/** 내부 파일은 검사 대상에서 제외
2. **lock 파일** (`package-lock.json` 등)은 검사하지 않음
3. **백엔드 SQLite 패키지**는 `sql.js` 또는 `better-sqlite3` 중 하나만 있으면 PASS
4. **TypeScript strict**는 `tsconfig.json` 또는 `tsconfig.app.json` 어디에든 있으면 PASS
