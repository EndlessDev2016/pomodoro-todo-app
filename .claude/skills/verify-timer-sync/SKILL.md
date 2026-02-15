---
name: verify-timer-sync
description: 서버 사이드 타이머 동기화 SYNC-T1~T5 검증. 브라우저 닫아도 타이머 상태 유지, 서버 시간 기준 경과시간 계산.
---

# 서버 타이머 동기화 검증

## Purpose

뽀모도로 타이머 상태가 서버에 저장되어 브라우저를 닫고 다시 열어도 이어지는지 검증합니다:

1. **서버 타이머 테이블** — timer_state 테이블에 현재 타이머 상태 저장
2. **서버 타이머 모델** — TimerModel의 get/upsert 메서드
3. **서버 타이머 API** — GET (서버 시간 기준 남은 시간 계산), PUT (상태 저장)
4. **클라이언트 복원** — 앱 로드 시 서버에서 타이머 상태 복원, running이면 경과시간 차감
5. **클라이언트 동기화** — start/pause/reset/onPhaseComplete 시 서버에 상태 전송

## When to Run

- `server/src/models/timer.ts` 추가/변경 후
- `server/src/routes/timer.ts` 추가/변경 후
- `server/src/models/db.ts`의 timer_state 테이블 변경 후
- `src/stores/timerStore.ts`의 서버 동기화 로직 변경 후

## Related Files

| File | Purpose |
|------|---------|
| `server/src/models/db.ts` | timer_state 테이블 정의 |
| `server/src/models/timer.ts` | TimerModel — get/upsert 메서드 |
| `server/src/routes/timer.ts` | GET /api/timer, PUT /api/timer |
| `server/src/index.ts` | timerRouter 등록 |
| `src/stores/timerStore.ts` | 서버 동기화 + 복원 로직 |

## Workflow

### Step 1: 서버 타이머 테이블 (SYNC-T1)

**파일:** `server/src/models/db.ts`

**검사:** timer_state 테이블 존재 + 필수 컬럼

```bash
grep -n "timer_state" server/src/models/db.ts
grep -A10 "timer_state" server/src/models/db.ts | grep -i "phase\|status\|remainingSeconds\|startedAt\|completedCycles\|activeTodoId\|activeSessionId"
```

**PASS:** timer_state 테이블에 phase, status, remainingSeconds, startedAt, completedCycles, activeTodoId, activeSessionId 컬럼 존재
**FAIL:** 테이블 또는 필수 컬럼 누락

**수정 방법:** db.ts의 initDb()에 CREATE TABLE IF NOT EXISTS timer_state 추가

### Step 2: 서버 타이머 모델 (SYNC-T2)

**파일:** `server/src/models/timer.ts`

**검사:** TimerModel 파일 존재 + get/upsert 메서드

```bash
ls server/src/models/timer* 2>/dev/null || echo "TIMER MODEL NOT FOUND"
grep -n "get\b\|upsert" server/src/models/timer.ts 2>/dev/null || echo "NO TIMER METHODS"
```

**PASS:** timer.ts 존재 + get() (현재 상태 조회), upsert() (상태 저장/갱신) 메서드 정의
**FAIL:** 파일 또는 메서드 부재

**수정 방법:** `server/src/models/timer.ts` 생성. get()은 단일 행 조회, upsert()는 INSERT OR REPLACE

### Step 3: 서버 타이머 API (SYNC-T3)

**파일:** `server/src/routes/timer.ts`, `server/src/index.ts`

**검사:** GET /api/timer + PUT /api/timer + 서버 시간 기준 경과 계산

```bash
ls server/src/routes/timer* 2>/dev/null || echo "TIMER ROUTE NOT FOUND"
grep -n "router\.get\|router\.put" server/src/routes/timer.ts 2>/dev/null || echo "NO TIMER ENDPOINTS"
grep -n "Date.now\|new Date\|elapsed\|경과" server/src/routes/timer.ts 2>/dev/null || echo "NO SERVER TIME CALC"
grep -n "timer" server/src/index.ts
```

**PASS 조건:**
- GET /api/timer: status=running이면 `startedAt`과 현재 서버 시간의 차이로 남은 시간을 계산하여 반환
- PUT /api/timer: 클라이언트에서 보낸 상태를 저장 + running이면 startedAt을 서버 시간으로 기록
- index.ts에 timerRouter 등록

**FAIL:** 엔드포인트 부재, 서버 시간 계산 없음, 라우트 미등록

### Step 4: 클라이언트 복원 로직 (SYNC-T4)

**파일:** `src/stores/timerStore.ts`

**검사:** 앱 로드 시 서버에서 타이머 상태 복원

```bash
grep -n "fetchTimer\|restoreTimer\|loadTimer\|GET.*timer\|/api/timer" src/stores/timerStore.ts
grep -n "export.*useTimerStore" src/stores/timerStore.ts
```

**PASS:** 서버에서 타이머 상태를 가져와 스토어에 반영하는 함수 존재 (fetchTimerState 등)
**FAIL:** 서버에서 타이머 상태를 복원하는 로직 없음

**수정 방법:** `fetchTimerState()` 액션 추가. GET /api/timer 호출 → 응답값으로 set(). running이었으면 서버가 계산한 remainingSeconds로 즉시 tick 재개

### Step 5: 클라이언트 동기화 전송 (SYNC-T5)

**파일:** `src/stores/timerStore.ts`

**검사:** start/pause/reset/onPhaseComplete에서 서버에 상태 전송

```bash
grep -n "PUT.*timer\|fetch.*timer\|TIMER_API\|/api/timer" src/stores/timerStore.ts
grep -B2 -A5 "start\|pause\|reset\|onPhaseComplete" src/stores/timerStore.ts | grep -i "fetch\|put\|api"
```

**PASS:** 4개 액션(start, pause, reset, onPhaseComplete) 모두에서 PUT /api/timer 호출
**FAIL:** 서버 전송 없는 액션이 있음

**수정 방법:** 각 액션 끝에 `syncToServer()` 헬퍼 호출 추가. PUT /api/timer에 현재 스토어 상태 전송

## Output Format

```markdown
| # | 검사 | 대상 | 상태 |
|---|------|------|------|
| SYNC-T1 | 타이머 테이블 | 백엔드 DB | PASS / FAIL |
| SYNC-T2 | 타이머 모델 | 백엔드 모델 | PASS / FAIL |
| SYNC-T3 | 타이머 API | 백엔드 라우트 | PASS / FAIL |
| SYNC-T4 | 클라이언트 복원 | 프런트 스토어 | PASS / FAIL |
| SYNC-T5 | 클라이언트 동기화 | 프런트 스토어 | PASS / FAIL |
```

## Exceptions

다음은 **문제가 아닙니다**:

1. **밀리초 단위 오차** — 서버↔클라이언트 간 1-2초 오차는 네트워크 지연으로 인한 허용 범위
2. **intervalId 미저장** — 런타임 타이머 핸들은 서버에 저장할 필요 없음 (복원 시 새로 생성)
3. **localStorage persist 병행** — 서버 동기화와 localStorage를 함께 사용하는 것은 문제가 아님 (오프라인 폴백)
4. **타이머 동작 중 서버 다운** — 서버 전송 실패 시 클라이언트 동작은 계속되어야 함 (에러 로그만)
5. **completedCycles 음수 방지** — 서버 계산 시 남은 시간이 0 이하가 되면 0으로 클램프하는 것은 정상
