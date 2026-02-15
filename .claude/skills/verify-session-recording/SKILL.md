---
name: verify-session-recording
description: PomodoroSession 생성·저장 SES-1~5 검증. timerStore, 세션 모델/라우트 변경 후 사용.
---

# セッション記録検証

## Purpose

뽀모도로 세션(PomodoroSession)이 실제로 생성·저장되는지 검증합니다:

1. **프론트 세션 생성** — 작업 시작 시 startedAt 기록
2. **프론트 세션 완료** — 작업 완료 시 completedAt 업데이트
3. **백엔드 모델** — SessionModel의 CRUD 메서드
4. **백엔드 API** — 세션 엔드포인트 (최소 Create + Read)
5. **프론트↔백 연동** — 세션 데이터 API 전송

## When to Run

- `src/stores/timerStore.ts`의 start/onPhaseComplete 수정 후
- `server/src/models/` 또는 `server/src/routes/`에 세션 관련 파일 추가/변경 후
- `src/types/index.ts`의 PomodoroSession 타입 변경 후

## Related Files

| File | Purpose |
|------|---------|
| `src/stores/timerStore.ts` | start, onPhaseComplete — 세션 생성/완료 트리거 |
| `src/types/index.ts` | PomodoroSession 타입 정의 |
| `server/src/models/db.ts` | pomodoro_sessions 테이블 정의 |
| `server/src/models/session.ts` | SessionModel (있을 경우) |
| `server/src/routes/sessions.ts` | 세션 API 라우트 (있을 경우) |

## Workflow

### Step 1: 프론트엔드 세션 생성 (SES-1)

**파일:** `src/stores/timerStore.ts`

**검사:** start 액션에서 PomodoroSession 생성 + startedAt 기록

```bash
grep -B2 -A10 "start\b" src/stores/timerStore.ts | head -20
grep -n "startedAt\|PomodoroSession\|activeSession\|sessionId" src/stores/timerStore.ts
grep -n "dayjs\|new Date\|toISOString" src/stores/timerStore.ts
```

**PASS:** start 시 세션 객체 생성 + startedAt 타임스탬프 기록
**FAIL:** start 액션에 세션 생성 로직 없음

**수정 방법:** start 액션에 `activeSession: { id: crypto.randomUUID(), todoId: activeTodoId, startedAt: dayjs().toISOString() }` 생성

### Step 2: 프론트엔드 세션 완료 (SES-2)

**파일:** `src/stores/timerStore.ts`

**검사:** onPhaseComplete에서 work 완료 시 completedAt 업데이트

```bash
grep -B2 -A15 "onPhaseComplete\|phaseComplete" src/stores/timerStore.ts
grep -n "completedAt" src/stores/timerStore.ts
```

**PASS:** `phase === 'work'` 조건 내 completedAt 갱신 존재
**FAIL:** completedAt 업데이트 로직 없음

**수정 방법:** onPhaseComplete에 `set({ activeSession: { ...activeSession, completedAt: dayjs().toISOString() } })` 추가

### Step 3: 백엔드 세션 모델 (SES-5)

**파일:** `server/src/models/`

**검사:** 세션 모델 파일 존재 + CRUD 메서드

```bash
ls server/src/models/session* 2>/dev/null || echo "SESSION MODEL NOT FOUND"
grep -rn "create\|findAll\|findByTodoId" server/src/models/session* 2>/dev/null || echo "NO SESSION METHODS"
grep -n "pomodoro_sessions" server/src/models/db.ts
```

**PASS:** 세션 모델 파일 존재 + create/find 메서드 정의
**FAIL:** 세션 모델 파일 또는 메서드 부재

**수정 방법:** `server/src/models/session.ts` 생성, db.ts의 pomodoro_sessions 테이블 활용

### Step 4: 백엔드 세션 API (SES-4)

**파일:** `server/src/routes/`

**검사:** 세션 라우트 엔드포인트 존재 (최소 POST + GET)

```bash
ls server/src/routes/session* 2>/dev/null || echo "SESSION ROUTE NOT FOUND"
grep -rn "router\.\(post\|get\)" server/src/routes/session* 2>/dev/null || echo "NO SESSION ENDPOINTS"
grep -n "session" server/src/index.ts
```

**PASS:** POST (생성) + GET (조회) 엔드포인트 존재 + index.ts에 라우트 등록
**FAIL:** 세션 라우트 미존재 또는 미등록

**수정 방법:** `server/src/routes/sessions.ts` 생성, POST /api/sessions + GET /api/sessions 구현, index.ts에 등록

### Step 5: 프론트↔백 세션 연동 (SES-3)

**파일:** `src/stores/timerStore.ts`

**검사:** 세션 생성/완료 시 백엔드 API 호출

```bash
grep -n "fetch.*session\|/api/session" src/stores/timerStore.ts
grep -n "fetch\|axios\|ky" src/stores/timerStore.ts
```

**PASS:** 세션 생성/완료 시점에 fetch 호출 존재
**FAIL:** 프론트엔드 로컬 상태에만 보관

**수정 방법:** start 시 POST /api/sessions 호출, onPhaseComplete 시 PATCH /api/sessions/:id 호출

## Output Format

```markdown
| Step | 검사 | 판정 | 비고 |
|------|------|------|------|
| 1 | 프론트 세션 생성 | PASS/FAIL | 상세 |
| 2 | 프론트 세션 완료 | PASS/FAIL | 상세 |
| 3 | 백엔드 모델 | PASS/FAIL | 상세 |
| 4 | 백엔드 API | PASS/FAIL | 상세 |
| 5 | 프론트↔백 연동 | PASS/FAIL | 상세 |
```

## Exceptions

1. 세션 저장을 프론트 로컬 상태에만 보관하는 것은 **FAIL** (백엔드 연동 필수)
2. 세션 삭제(Delete) API는 MVP에서 선택사항
3. 세션 목록 UI 표시는 이 스킬 범위 밖 (별도 스킬로 분리 가능)
4. `node_modules/` 제외
