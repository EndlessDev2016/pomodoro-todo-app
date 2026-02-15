---
name: verify-cross-store-sync
description: todoStore↔timerStore 간 연동 및 삭제 안전성 SYNC-1~6 검증.
---

# 스토어간 관련 검증

## Purpose

todoStore와 timerStore 간 연동 및 삭제 안전성을 검증합니다:

1. **삭제→리셋** — 바인딩된 Todo 삭제 시 타이머 리셋
2. **삭제 확인** — confirm() 대화상자로 실수 방지
3. **카운트 연동** — 작업 완료 시 자동 incrementPomodoro
4. **선택 차단** — 완료 Todo에 대한 뽀모도로 선택 불가
5. **실행중 완료 경고** — 실행 중인 TODO 체크박스 클릭 시 alert 경고 후 토글+리셋
6. **실행중 전환 경고** — 실행 중에 다른 TODO 클릭 시 confirm 경고 후 전환

## When to Run

- `src/stores/todoStore.ts` 또는 `src/stores/timerStore.ts` 수정 후
- `src/components/TodoItem.tsx` 삭제/시작 버튼 로직 변경 후
- 스토어 간 참조 방식 변경 후

## Related Files

| File | Purpose |
|------|---------|
| `src/stores/todoStore.ts` | deleteTodo, incrementPomodoro 액션 |
| `src/stores/timerStore.ts` | activeTodoId, reset, onPhaseComplete |
| `src/components/TodoItem.tsx` | 삭제 버튼, ▶ 시작 버튼 UI |
| `src/components/TodoList.tsx` | 삭제 핸들러 (위치에 따라) |

## Workflow

### Step 1: 삭제 시 타이머 리셋 (SYNC-1 / D3)

**파일:** `src/stores/todoStore.ts`, `src/components/TodoItem.tsx`

**검사:** deleteTodo 시 activeTodoId와 비교 후 reset 호출

```bash
grep -n "activeTodoId\|timerStore\|useTimerStore" src/stores/todoStore.ts
grep -n "reset\|activeTodoId" src/components/TodoItem.tsx src/components/TodoList.tsx
grep -B2 -A5 "deleteTodo\|handleDelete" src/components/TodoItem.tsx
```

**PASS:** 삭제 대상 === activeTodoId 비교 + reset() 호출 존재
**FAIL:** deleteTodo가 timerStore를 전혀 참조하지 않음

**수정 방법:** 삭제 핸들러에서 `useTimerStore.getState().activeTodoId === id` 체크 후 `reset()` 호출

### Step 2: 삭제 확인 대화상자 (SYNC-2 / B4)

**파일:** `src/components/TodoItem.tsx`

**검사:** 삭제 전 confirm() 또는 커스텀 모달 존재

```bash
grep -n "confirm\|Confirm\|확인\|삭제" src/components/TodoItem.tsx
grep -n "confirm\|Confirm" src/components/TodoList.tsx
```

**PASS:** `window.confirm()` 또는 커스텀 확인 UI 존재 + 취소 시 삭제 미실행
**FAIL:** 삭제 버튼 클릭 즉시 삭제

**수정 방법:** `if (!window.confirm('정말 삭제하시겠습니까?')) return;` 추가

### Step 3: 작업 완료 시 카운트 연동 (SYNC-3 / D2)

**파일:** `src/stores/timerStore.ts`

**검사:** onPhaseComplete에서 work 페이즈 완료 시 incrementPomodoro 호출

```bash
grep -B2 -A10 "onPhaseComplete\|phaseComplete" src/stores/timerStore.ts
grep -n "incrementPomodoro\|todoStore\|useTodoStore" src/stores/timerStore.ts
```

**PASS:** `phase === 'work'` 조건 + `incrementPomodoro(activeTodoId)` 호출 존재
**FAIL:** timerStore가 todoStore를 참조하지 않음

**수정 방법:** onPhaseComplete에 `if (phase === 'work' && activeTodoId) useTodoStore.getState().incrementPomodoro(activeTodoId)` 추가

### Step 4: 완료 Todo 뽀모도로 선택 차단 (SYNC-4)

**파일:** `src/components/TodoItem.tsx`

**검사:** completed Todo의 리스트 클릭 시 뽀모도로 선택 차단

```bash
grep -B2 -A5 "handleItemClick" src/components/TodoItem.tsx
grep -n "todo.completed" src/components/TodoItem.tsx
```

**PASS:** `todo.completed` 체크로 뽀모도로 선택 차단 (return early)
**FAIL:** 완료된 Todo에서도 뽀모도로 선택 가능

### Step 5: 실행중 TODO 완료 시 alert 경고 (SYNC-5)

**파일:** `src/components/TodoItem.tsx`

**검사:** 실행 중(active + running)인 TODO의 체크박스 클릭 시 alert 경고 + 확인 후 토글+리셋

```bash
grep -n "alert\|window.confirm\|초기화" src/components/TodoItem.tsx
grep -n "handleCheckbox" src/components/TodoItem.tsx
```

**PASS:** 실행중 TODO 체크박스에 alert/confirm 경고 + "초기화" 안내 + 확인 시 toggle+reset
**FAIL:** 실행중 TODO도 경고 없이 즉시 완료 토글

**수정 방법:** handleCheckboxChange에서 isActive + running 체크 → confirm 후 onToggle + reset

### Step 6: 실행중 다른 TODO 전환 경고 (SYNC-6)

**파일:** `src/components/TodoItem.tsx`

**검사:** 타이머 실행 중에 다른 TODO를 클릭하면 confirm 경고 후 전환

```bash
grep -B2 -A8 "handleItemClick" src/components/TodoItem.tsx
grep -n "isRunning.*isActive\|!isActive" src/components/TodoItem.tsx
```

**PASS:** `isRunning && !isActive` 조건 + confirm 경고("초기화됩니다") + 취소 시 전환 안 함
**FAIL:** 실행 중에 다른 TODO 클릭 시 경고 없이 즉시 전환

**수정 방법:** handleItemClick에서 `isRunning && !isActive` 체크 → confirm 후 onSelectTodo

## Output Format

```markdown
| Step | 검사 | 판정 | 비고 |
|------|------|------|------|
| 1 | 삭제→타이머 리셋 | PASS/FAIL | 상세 |
| 2 | 삭제 confirm | PASS/FAIL | 상세 |
| 3 | 카운트 연동 | PASS/FAIL | 상세 |
| 4 | 완료 Todo 차단 | PASS/FAIL | 상세 |
| 5 | 실행중 완료 경고 | PASS/FAIL | 상세 |
| 6 | 실행중 전환 경고 | PASS/FAIL | 상세 |
```

## Exceptions

1. 스토어 간 참조는 `useXxxStore.getState()` 직접 호출 또는 컴포넌트 레벨 조합 모두 허용
2. 커스텀 모달 대신 브라우저 기본 `confirm()` 사용 가능
3. `node_modules/` 제외
