---
name: verify-todo-domain
description: TODO 도메인 규칙 B1-B6 검증. Todo 타입, CRUD 액션, 토글, 삭제 확인, 프런트-백 스키마 일치 변경 후 사용.
---

# TODO 도메인 검증

## Purpose

TODO 도메인 모델이 합의된 규칙(B1-B6)을 준수하는지 검증합니다:

1. **타입 필드 완전성** — Todo 인터페이스의 모든 필수 필드 존재
2. **CRUD 완전성** — addTodo, updateTodo, deleteTodo, toggleTodo 액션 존재
3. **비즈니스 로직** — 토글 시 completed 반전 + updatedAt 갱신, 빈 제목 가드
4. **프런트-백 일치** — 타입 필드와 DB 스키마 동기화
5. **MVP 경계** — 아직 구현하지 않을 필드(priority, tags 등) 부재

## When to Run

- `src/types/index.ts`의 Todo 타입 변경 후
- `src/stores/todoStore.ts` 수정 후
- `server/src/models/db.ts` 또는 `server/src/models/todo.ts` 변경 후
- `src/components/TodoItem.tsx` 삭제 관련 로직 변경 후

## Related Files

| File | Purpose |
|------|---------|
| `src/types/index.ts` | Todo, TimerPhase, TimerStatus, PomodoroSession 타입 정의 |
| `src/stores/todoStore.ts` | CRUD + toggleTodo + incrementPomodoro 액션 |
| `src/components/TodoItem.tsx` | 삭제 확인, 인라인 편집, 뽀모도로 시작 UI |
| `server/src/models/db.ts` | SQLite 테이블 생성 SQL |
| `server/src/models/todo.ts` | TodoModel CRUD 메서드 |

## Workflow

### Step 1: Todo 타입 필드 검증 (B1)

**파일:** `src/types/index.ts`

**검사:** 필수 필드 7개 존재

```bash
grep -n "id" src/types/index.ts
grep -n "title" src/types/index.ts
grep -n "description?" src/types/index.ts
grep -n "completed" src/types/index.ts
grep -n "completedPomodoros" src/types/index.ts
grep -n "createdAt" src/types/index.ts
grep -n "updatedAt" src/types/index.ts
```

**PASS:** 7개 필드 모두 존재, description은 optional(?)
**FAIL:** 누락된 필드가 있음

### Step 2: CRUD 완전성 + 빈 제목 가드 (B2)

**파일:** `src/stores/todoStore.ts`

**검사:** 4개 액션 + title.trim() 가드

```bash
grep -n "addTodo" src/stores/todoStore.ts
grep -n "updateTodo" src/stores/todoStore.ts
grep -n "deleteTodo" src/stores/todoStore.ts
grep -n "toggleTodo" src/stores/todoStore.ts
grep -n "title.trim()" src/stores/todoStore.ts
```

**PASS:** 4개 액션 + trim 가드 존재
**FAIL:** 액션 누락 또는 빈 제목 가드 없음

**수정 방법:** addTodo 시작에 `if (!title.trim()) return;` 추가

### Step 3: 완료 토글 로직 (B3)

**파일:** `src/stores/todoStore.ts`

**검사:** toggleTodo에서 completed 반전 + updatedAt 갱신

```bash
grep -A5 "toggleTodo" src/stores/todoStore.ts | grep "!todo.completed\|!completed"
grep -A5 "toggleTodo" src/stores/todoStore.ts | grep "updatedAt"
```

**PASS:** !completed 반전 + updatedAt 갱신 모두 존재
**FAIL:** 어느 하나 누락

### Step 4: MVP 경계 (B5)

**파일:** `src/types/index.ts`

**검사:** 금지 필드 부재

```bash
grep -c "priority" src/types/index.ts
grep -c "tags" src/types/index.ts
grep -c "subtasks" src/types/index.ts
```

**PASS:** 3개 모두 0건
**FAIL:** MVP 범위 밖 필드가 존재

### Step 5: 프런트-백 스키마 일치 (B6)

**파일:** `server/src/models/db.ts`

**검사:** todos 테이블에 프런트 타입의 모든 필드가 컬럼으로 존재

```bash
grep -n "id TEXT" server/src/models/db.ts
grep -n "title TEXT" server/src/models/db.ts
grep -n "description TEXT" server/src/models/db.ts
grep -n "completed INTEGER" server/src/models/db.ts
grep -n "completedPomodoros INTEGER" server/src/models/db.ts
grep -n "createdAt TEXT" server/src/models/db.ts
grep -n "updatedAt TEXT" server/src/models/db.ts
```

**PASS:** 7개 컬럼 모두 존재
**FAIL:** 프런트 타입에 있는 필드가 DB에 없음

### Step 6: 삭제 확인 대화상자 (B4)

**파일:** `src/components/TodoItem.tsx`

**검사:** 삭제 시 confirm 호출

```bash
grep -n "confirm(" src/components/TodoItem.tsx
```

**PASS:** confirm() 또는 동등 확인 UI 존재
**FAIL:** 확인 없이 즉시 삭제

**수정 방법:** `if (!window.confirm('삭제하시겠습니까?')) return;`

## Output Format

```markdown
| Step | 검사 | 판정 | 비고 |
|------|------|------|------|
| 1 | Todo 타입 필드 | PASS/FAIL | 상세 |
| 2 | CRUD + 빈제목 가드 | PASS/FAIL | 상세 |
| 3 | 토글 로직 | PASS/FAIL | 상세 |
| 4 | MVP 경계 | PASS/FAIL | 상세 |
| 5 | 프런트-백 일치 | PASS/FAIL | 상세 |
| 6 | 삭제 confirm | PASS/FAIL | 상세 |
```

## Exceptions

1. **description 필드**는 optional(`?`)이어야 하며, 누락이 아닌 optional 표기 없는 경우만 FAIL
2. **DB 컬럼명** snake_case 허용 (예: `completed_pomodoros`) — 매핑만 확인
3. **node_modules/** 제외
