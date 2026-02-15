---
name: verify-pomodoro-domain
description: 뽀모도로 도메인 C1-C7 및 TODO↔뽀모 연결 D1-D4 검증. timerStore, 타입 정의 변경 후 사용.
---

# 뽀모도로 도메인 검증

## Purpose

뽀모도로 타이머 로직과 TODO 연결이 합의된 규칙(C1-C7, D1-D4)을 준수하는지 검증합니다:

1. **타이머 상수** — 25분/5분/15분/4회 정확한 값
2. **상태·페이즈 타입** — idle/running/paused, work/shortBreak/longBreak
3. **자동 사이클 전환** — work↔break 양방향 자동 전환
4. **Pattern A 바인딩** — 타이머 시작 시 todoId 필수
5. **카운트 연동** — 작업 완료 시 completedPomodoros +1

## When to Run

- `src/stores/timerStore.ts` 변경 후
- `src/types/index.ts`의 TimerPhase, TimerStatus, PomodoroSession 변경 후
- 타이머 관련 컴포넌트 변경 후

## Related Files

| File | Purpose |
|------|---------|
| `src/stores/timerStore.ts` | 타이머 상수, 상태, start/pause/reset/tick/onPhaseComplete 액션 |
| `src/types/index.ts` | TimerPhase, TimerStatus, PomodoroSession 타입 |
| `src/stores/todoStore.ts` | incrementPomodoro 액션 (D2 연동 대상) |

## Workflow

### Step 1: 타이머 상수 확인 (C1, C2)

**파일:** `src/stores/timerStore.ts`

**검사:** 4개 상수 정확한 값

```bash
grep -n "25 \* 60\|1500" src/stores/timerStore.ts
grep -n "5 \* 60\|300" src/stores/timerStore.ts
grep -n "15 \* 60\|900" src/stores/timerStore.ts
grep -n "LONG_BREAK_INTERVAL.*=.*4\|= 4" src/stores/timerStore.ts
```

**PASS:** WORK=1500, SHORT_BREAK=300, LONG_BREAK=900, INTERVAL=4
**FAIL:** 값이 다르거나 상수 누락

### Step 2: 상태·페이즈 타입 (C3, C4, C7)

**파일:** `src/types/index.ts`

**검사:** TimerStatus, TimerPhase, PomodoroSession 타입 정의

```bash
grep -n "TimerStatus" src/types/index.ts
grep -n "'idle'\|'running'\|'paused'" src/types/index.ts
grep -n "TimerPhase" src/types/index.ts
grep -n "'work'\|'shortBreak'\|'longBreak'" src/types/index.ts
grep -n "PomodoroSession" src/types/index.ts
```

**PASS:** TimerStatus = idle|running|paused, TimerPhase = work|shortBreak|longBreak, PomodoroSession 존재
**FAIL:** 타입 누락 또는 값 불일치

### Step 3: 자동 사이클 전환 (C5)

**파일:** `src/stores/timerStore.ts`

**검사:** onPhaseComplete에서 work→break, break→work 양방향 전환

```bash
grep -n "onPhaseComplete" src/stores/timerStore.ts
grep -A30 "onPhaseComplete" src/stores/timerStore.ts | grep "shortBreak\|longBreak"
grep -A30 "onPhaseComplete" src/stores/timerStore.ts | grep "phase: 'work'"
```

**PASS:** work→(shortBreak|longBreak) 전환 + break→work 전환 모두 존재
**FAIL:** 한 방향 전환이 누락

### Step 4: Pattern A 바인딩 (D1, D3)

**파일:** `src/stores/timerStore.ts`

**검사:** start 액션에 todoId 필수 + 삭제 시 리셋

```bash
grep -n "start.*todoId" src/stores/timerStore.ts
grep -n "if.*!todoId" src/stores/timerStore.ts
```

**PASS:** start(todoId: string) 시그니처 + todoId 가드 존재
**FAIL:** todoId 없이 시작 가능

### Step 5: 알림 구현 (C6)

**파일:** `src/stores/timerStore.ts`

**검사:** 브라우저 Notification + Audio 알림

```bash
grep -n "Notification" src/stores/timerStore.ts
grep -n "new Audio\|Audio(" src/stores/timerStore.ts
```

**PASS:** Notification + Audio 둘 다 존재
**FAIL:** 알림 수단 누락

## Output Format

```markdown
| Step | 검사 | 판정 | 비고 |
|------|------|------|------|
| 1 | 타이머 상수 | PASS/FAIL | 상세 |
| 2 | 상태·페이즈 타입 | PASS/FAIL | 상세 |
| 3 | 자동 사이클 전환 | PASS/FAIL | 상세 |
| 4 | Pattern A 바인딩 | PASS/FAIL | 상세 |
| 5 | 알림 구현 | PASS/FAIL | 상세 |
```

## Exceptions

1. **알림 권한** — `Notification.requestPermission` 존재하면 PASS, 실제 권한 상태는 런타임이므로 미검증
2. **Audio 파일** — `new Audio()` 호출 존재만 확인, 실제 파일 경로 유효성은 미검증
3. **node_modules/** 제외
