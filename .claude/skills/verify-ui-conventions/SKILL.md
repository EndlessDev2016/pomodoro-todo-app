---
name: verify-ui-conventions
description: UX/동작 규칙 E1-E9 검증. 컴포넌트, CSS, App 레이아웃 변경 후 사용.
---

# UX/동작 규칙 검증

## Purpose

UI/UX 규칙(E1-E8)이 올바르게 구현되었는지 검증합니다:

1. **단일 페이지 레이아웃** — 상단 타이머 + 하단 TODO, 라우팅 없음
2. **네이밍 규칙** — 컴포넌트 PascalCase
3. **반응형 디자인** — 미디어 쿼리 또는 반응형 유틸리티
4. **UI 기능** — 완료 분리, 바인딩 표시, 🍅 카운트, 인라인 편집
5. **클릭 동작** — 리스트 클릭→활성 TODO 선택만(시작X), 체크박스→실행중이면 alert 경고 후 토글

## When to Run

- `src/components/` 내 파일 추가/수정 후
- `src/App.tsx` 레이아웃 변경 후
- CSS/SCSS 파일 변경 후
- 새 컴포넌트 생성 시

## Related Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | 메인 레이아웃 (Timer + TodoList) |
| `src/App.css` | 전체 스타일 + 반응형 미디어 쿼리 |
| `src/components/Timer.tsx` | 타이머 UI + 활성 TODO 표시 |
| `src/components/TodoItem.tsx` | 개별 TODO (🍅 카운트, 인라인 편집, ▶ 버튼) |
| `src/components/TodoList.tsx` | TODO 목록 (미완료/완료 분리) |

## Workflow

### Step 1: 단일 페이지 레이아웃 (E1)

**파일:** `src/App.tsx`

**검사:** Timer + TodoList가 하나의 페이지에 렌더링, 라우팅 없음

```bash
grep -n "Timer\|TodoList" src/App.tsx
grep -rc "react-router\|BrowserRouter\|Routes" src/ --include="*.tsx"
```

**PASS:** Timer + TodoList 존재 + react-router 0건
**FAIL:** 라우터 사용 또는 컴포넌트 누락

### Step 2: PascalCase 컴포넌트 (E2)

**파일:** `src/components/`

**검사:** 파일명 + export 함수명 PascalCase

```bash
ls src/components/*.tsx
grep -n "export default function" src/components/*.tsx
```

**PASS:** 모든 파일명이 대문자 시작 + export 함수도 PascalCase
**FAIL:** camelCase 또는 kebab-case 파일명

**수정 방법:** 파일명을 PascalCase로 변경 (예: `todo-item.tsx` → `TodoItem.tsx`)

### Step 3: 반응형 CSS (E3)

**파일:** `src/App.css`

**검사:** @media 쿼리 존재

```bash
grep -n "@media" src/App.css
```

**PASS:** @media 쿼리 최소 1개 존재
**FAIL:** 반응형 규칙 없음

**수정 방법:** `@media (max-width: 480px) { ... }` 추가

### Step 4: 완료 TODO 분리 (E4)

**파일:** `src/components/TodoList.tsx`

**검사:** completed 기준 분리 렌더링

```bash
grep -n "completed" src/components/TodoList.tsx
grep -n "filter" src/components/TodoList.tsx
```

**PASS:** `!t.completed` + `t.completed` 분리 필터링 존재
**FAIL:** 분리 없이 단일 리스트

### Step 5: 타이머 바인딩 TODO 표시 (E5)

**파일:** `src/components/Timer.tsx`

**검사:** activeTodoId에 해당하는 Todo 제목 표시

```bash
grep -n "activeTodo" src/components/Timer.tsx
grep -n "todoTitle\|activeTodoTitle" src/components/Timer.tsx src/App.tsx
```

**PASS:** 활성 TODO 제목 표시 로직 존재
**FAIL:** 바인딩된 TODO 표시 없음

### Step 6: 뽀모도로 카운트 표시 + 인라인 편집 (E6, E7)

**파일:** `src/components/TodoItem.tsx`

**검사:** 🍅 표시 + isEditing 상태 기반 편집 모드

```bash
grep -n "completedPomodoros\|🍅" src/components/TodoItem.tsx
grep -n "isEditing\|setIsEditing" src/components/TodoItem.tsx
```

**PASS:** 🍅 카운트 표시 + 인라인 편집 모드 존재
**FAIL:** 누락

### Step 7: 타이머 상태 복원 (E8)

**파일:** `src/stores/timerStore.ts`

**검사:** 서버 동기화로 브라우저 재접속 시 타이머 복원

```bash
grep -c "fetchTimerState\|TIMER_API\|syncToServer" src/stores/timerStore.ts
```

**PASS:** fetchTimerState + syncToServer 로직 존재 (서버 동기화)
**FAIL:** 타이머 상태 복원 로직 없음

### Step 8: TODO 리스트 클릭 동작 (E9)

**파일:** `src/components/TodoItem.tsx`, `src/stores/timerStore.ts`

**검사:**
- 리스트(li) 클릭 → 활성 TODO 선택만 (타이머 시작하지 않음, setActiveTodo 호출)
- 실행 중에 다른 TODO 클릭 → confirm 경고("현재 진행 중인 뽀모도로가 초기화됩니다") 후 전환
- 체크박스 클릭 → 실행 중인 TODO면 alert 경고("완료 시 뽀모도로 시간이 초기화됩니다"), 확인 시 토글 + 리셋
- 유저가 반드시 ▶ 시작 버튼을 눌러야 타이머 시작

```bash
grep -n "handleItemClick\|handleCheckbox\|setActiveTodo" src/components/TodoItem.tsx
grep -n "setActiveTodo" src/stores/timerStore.ts
grep -n "alert\|window.confirm" src/components/TodoItem.tsx
```

**PASS:** li 클릭 → setActiveTodo(선택만) + 실행중 다른 TODO 전환 시 confirm 경고 + 체크박스 → 실행중 alert 경고 존재 + 타이머 자동 시작 없음
**FAIL:** 리스트 클릭 시 start() 호출 또는 실행중 전환/체크박스에 경고 없음

## Output Format

```markdown
| Step | 검사 | 판정 | 비고 |
|------|------|------|------|
| 1 | 단일 페이지 | PASS/FAIL | 상세 |
| 2 | PascalCase | PASS/FAIL | 상세 |
| 3 | 반응형 CSS | PASS/FAIL | 상세 |
| 4 | 완료 분리 | PASS/FAIL | 상세 |
| 5 | 바인딩 표시 | PASS/FAIL | 상세 |
| 6 | 🍅 + 인라인편집 | PASS/FAIL | 상세 |
| 7 | 타이머 복원 | PASS/FAIL | 상세 |
| 8 | 클릭 동작 | PASS/FAIL | 상세 |
```

## Exceptions

1. **CSS 프레임워크** 사용 시 @media 대신 반응형 유틸리티 클래스(sm:, md:)로 대체 가능
2. **스타일링 방식** — CSS Modules, styled-components, Tailwind 등 자유
3. **node_modules/** 제외
