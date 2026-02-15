---
name: verify-api-integration
description: 프론트↔백엔드 API 연동 API-1~7 검증. todoStore, 서버 라우트 변경 후 사용.
---

# API 연동 검증

## Purpose

프론트엔드 todoStore와 백엔드 REST API가 올바르게 연동되었는지 검증합니다:

1. **초기 로딩** — 앱 시작 시 서버에서 TODO 목록 fetch
2. **CRUD 연동** — 각 액션이 대응 API를 호출
3. **에러 핸들링** — API 실패 시 롤백 또는 피드백

## When to Run

- `src/stores/todoStore.ts`에 API 호출 로직 추가/수정 후
- `server/src/routes/todos.ts` 엔드포인트 변경 후
- `vite.config.ts`의 프록시 설정 변경 후

## Related Files

| File | Purpose |
|------|---------|
| `src/stores/todoStore.ts` | CRUD 액션 + API 호출 |
| `server/src/routes/todos.ts` | REST API 엔드포인트 |
| `server/src/index.ts` | Express 서버 설정 (포트, CORS) |
| `vite.config.ts` | API 프록시 설정 (선택) |

## Workflow

### Step 1: 초기 데이터 로딩 (API-1)

**파일:** `src/stores/todoStore.ts`, `src/App.tsx`

**검사:** 앱 마운트 시 GET /api/todos 호출 + 스토어 반영

```bash
grep -rn "fetch.*api/todos\|/api/todos" src/stores/todoStore.ts src/App.tsx
grep -n "fetchTodos\|loadTodos\|initTodos" src/stores/todoStore.ts
```

**PASS:** fetch 호출 + 스토어 set 로직 존재
**FAIL:** 초기 로딩 없음 (로컬 빈 배열로만 시작)

**수정 방법:** todoStore에 `fetchTodos` 액션 추가, App.tsx에서 useEffect로 호출

### Step 2: Create 연동 (API-2)

**파일:** `src/stores/todoStore.ts`

**검사:** addTodo에서 POST /api/todos 호출

```bash
grep -A10 "addTodo" src/stores/todoStore.ts | grep -i "fetch\|post\|api/todos"
```

**PASS:** POST 호출 존재
**FAIL:** 로컬 상태만 변경, 서버 호출 없음

### Step 3: Update + Toggle 연동 (API-3, API-5)

**파일:** `src/stores/todoStore.ts`

**검사:** updateTodo, toggleTodo에서 PATCH 호출

```bash
grep -A10 "updateTodo" src/stores/todoStore.ts | grep -i "fetch\|patch\|api/todos"
grep -A10 "toggleTodo" src/stores/todoStore.ts | grep -i "fetch\|patch\|api/todos"
```

**PASS:** 두 액션 모두 PATCH 호출 존재
**FAIL:** 서버 호출 누락

### Step 4: Delete 연동 (API-4)

**파일:** `src/stores/todoStore.ts`

**검사:** deleteTodo에서 DELETE 호출

```bash
grep -A10 "deleteTodo" src/stores/todoStore.ts | grep -i "fetch\|delete\|api/todos"
```

**PASS:** DELETE 호출 존재
**FAIL:** 로컬 삭제만 수행

### Step 5: Pomodoro 카운트 연동 (API-6)

**파일:** `src/stores/todoStore.ts`

**검사:** incrementPomodoro에서 POST /api/todos/:id/pomodoro 호출

```bash
grep -A10 "incrementPomodoro" src/stores/todoStore.ts | grep -i "fetch\|post\|pomodoro"
```

**PASS:** POST 호출 존재
**FAIL:** 서버 호출 없음

### Step 6: 에러 핸들링 (API-7)

**파일:** `src/stores/todoStore.ts`

**검사:** API 호출에 try/catch 또는 .catch() 존재

```bash
grep -c "try {" src/stores/todoStore.ts
grep -c "\.catch(" src/stores/todoStore.ts
grep -c "console.error\|console.warn" src/stores/todoStore.ts
```

**PASS:** try/catch 또는 .catch 존재 (합계 1건 이상)
**FAIL:** 에러 핸들링 전무

**수정 방법:** 각 fetch 호출을 try/catch로 감싸고 실패 시 이전 상태 복원

## Output Format

```markdown
| Step | 검사 | 판정 | 비고 |
|------|------|------|------|
| 1 | 초기 로딩 | PASS/FAIL | 상세 |
| 2 | Create | PASS/FAIL | 상세 |
| 3 | Update+Toggle | PASS/FAIL | 상세 |
| 4 | Delete | PASS/FAIL | 상세 |
| 5 | Pomodoro 카운트 | PASS/FAIL | 상세 |
| 6 | 에러 핸들링 | PASS/FAIL | 상세 |
```

## Exceptions

1. **API 호출 방식**은 fetch, axios, ky 등 자유
2. **낙관적 업데이트** 패턴이면 서버 호출 순서는 유연하게 허용
3. **URL 형식** — Vite 프록시(`/api/todos`) 또는 절대 URL(`http://localhost:3001/api/todos`) 모두 허용
4. **node_modules/** 제외
