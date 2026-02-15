---
name: manage-skills
description: 세션 변경사항을 분석하여 검증 스킬 누락을 탐지합니다. 기존 스킬을 동적으로 탐색하고, 새 스킬을 생성하거나 기존 스킬을 업데이트한 뒤 CLAUDE.md를 관리합니다.
disable-model-invocation: true
argument-hint: "[선택사항: 특정 스킬 이름 또는 집중할 영역]"
---

# 세션 기반 스킬 유지보수

## 목적

현재 세션에서 변경된 내용을 분석하여 검증 스킬의 드리프트를 탐지하고 수정합니다:

1. **커버리지 누락** — 어떤 verify 스킬에서도 참조하지 않는 변경된 파일
2. **유효하지 않은 참조** — 삭제되거나 이동된 파일을 참조하는 스킬
3. **누락된 검사** — 기존 검사에서 다루지 않는 새로운 패턴/규칙
4. **오래된 값** — 더 이상 일치하지 않는 설정값 또는 탐지 명령어

## 실행 시점

- 새로운 패턴이나 규칙을 도입하는 기능을 구현한 후
- 기존 verify 스킬을 수정하고 일관성을 점검하고 싶을 때
- PR 전에 verify 스킬이 변경된 영역을 커버하는지 확인할 때
- 검증 실행 시 예상했던 이슈를 놓쳤을 때
- 주기적으로 스킬을 코드베이스 변화에 맞춰 정렬할 때

## 등록된 검증 스킬

| # | 스킬 | 설명 | 커버 파일 패턴 |
|---|------|------|---------------|
| 1 | `verify-tech-stack` | 아키텍처 원칙 A1-A8 | `package.json`, `server/package.json`, `tsconfig*.json`, `vite.config.ts`, `src/stores/*.ts` |
| 2 | `verify-todo-domain` | TODO 도메인 B1-B6 | `src/types/index.ts`, `src/stores/todoStore.ts`, `src/components/TodoItem.tsx`, `server/src/models/{db,todo}.ts` |
| 3 | `verify-pomodoro-domain` | 뽀모도로 도메인 C1-C7, 연결 D1-D4 | `src/stores/timerStore.ts`, `src/types/index.ts`, `src/stores/todoStore.ts` |
| 4 | `verify-ui-conventions` | UX/동작 규칙 E1-E8 | `src/App.tsx`, `src/App.css`, `src/components/{Timer,TodoItem,TodoList}.tsx` |
| 5 | `verify-api-integration` | 프론트↔백엔드 연동 API-1~7 | `src/stores/todoStore.ts`, `server/src/routes/todos.ts`, `server/src/index.ts`, `vite.config.ts` |
| 6 | `verify-cross-store-sync` | 스토어 간 연동·삭제 안전성 SYNC-1~4 | `src/stores/*.ts`, `src/components/{TodoItem,TodoList}.tsx` |
| 7 | `verify-session-recording` | 뽀모도로 세션 기록·저장 SES-1~5 | `src/stores/timerStore.ts`, `src/types/index.ts`, `server/src/models/{db,session}.ts`, `server/src/routes/sessions.ts` |
| 8 | `verify-build` | 프런트·백엔드 빌드 검증 BUILD-1~4 | `package.json`, `server/package.json`, `tsconfig*.json`, `vite.config.ts`, `src/**/*.{ts,tsx}`, `server/src/**/*.ts` |

## 워크플로우

### Step 1: 세션 변경사항 분석

현재 세션에서 변경된 모든 파일을 수집합니다:

```bash
git diff HEAD --name-only
git log --oneline main..HEAD 2>/dev/null
git diff main...HEAD --name-only 2>/dev/null
```

중복을 제거한 목록으로 합칩니다. 선택적 인수로 스킬 이름이나 영역이 지정된 경우 관련 파일만 필터링합니다.

**표시:** 최상위 디렉토리 기준으로 파일을 그룹화합니다:

```markdown
## 세션 변경사항 감지

**이 세션에서 N개 파일 변경됨:**

| 디렉토리 | 파일 |
|----------|------|
| src/stores | `todoStore.ts`, `timerStore.ts` |
| src/components | `Timer.tsx`, `TodoItem.tsx` |
| server/src | `index.ts`, `routes/todos.ts` |
```

### Step 2: 등록된 스킬과 변경 파일 매핑

#### Sub-step 2a: 등록된 스킬 확인

**등록된 검증 스킬** 테이블에서 각 스킬의 이름과 커버 파일 패턴을 읽습니다.

등록된 스킬이 0개인 경우, Step 4로 바로 이동합니다.

등록된 스킬이 1개 이상인 경우, 각 스킬의 `.claude/skills/verify-<name>/SKILL.md`를 읽고 추가 파일 경로 패턴을 추출합니다.

#### Sub-step 2b: 변경된 파일을 스킬에 매칭

Step 1에서 수집한 각 변경 파일에 대해, 등록된 스킬의 패턴과 대조합니다.

#### Sub-step 2c: 매핑 표시

```markdown
### 파일 → 스킬 매핑

| 스킬 | 트리거 파일 (변경된 파일) | 액션 |
|------|--------------------------|------|
| verify-todo-domain | `todoStore.ts`, `TodoItem.tsx` | CHECK |
| verify-api-integration | `todoStore.ts`, `routes/todos.ts` | CHECK |
| (스킬 없음) | `README.md` | UNCOVERED |
```

### Step 3: 영향받은 스킬의 커버리지 갭 분석

영향받은 각 스킬에 대해, 전체 SKILL.md를 읽고 다음을 점검합니다:

1. **누락된 파일 참조** — 변경 파일이 Related Files에 없는 경우
2. **오래된 탐지 명령어** — grep/glob 패턴이 현재 구조와 불일치
3. **커버되지 않은 새 패턴** — 스킬이 검사하지 않는 새로운 규칙
4. **삭제된 파일의 잔여 참조** — 존재하지 않는 파일을 참조
5. **변경된 값** — 스킬이 검사하는 특정 값이 수정됨

### Step 4: CREATE vs UPDATE 결정

```
커버되지 않은 각 파일 그룹에 대해:
    IF 기존 스킬의 도메인과 관련된 파일인 경우:
        → 결정: 기존 스킬 UPDATE (커버리지 확장)
    ELSE IF 3개 이상의 관련 파일이 공통 규칙/패턴을 공유하는 경우:
        → 결정: 새 verify 스킬 CREATE
    ELSE:
        → "면제"로 표시 (스킬 불필요)
```

결과를 사용자에게 제시하고 `AskUserQuestion`으로 확인합니다.

### Step 5: 기존 스킬 업데이트

**규칙:**
- **추가/수정만** — 아직 작동하는 기존 검사는 절대 제거하지 않음
- Related Files에 새 파일 경로 추가
- 새 탐지 명령어 추가
- 삭제 확인된 파일의 참조 제거
- 변경된 특정 값 업데이트

### Step 6: 새 스킬 생성

1. **탐색** — 관련 변경 파일을 읽어 패턴을 이해
2. **사용자에게 스킬 이름 확인** — `verify-`로 시작, kebab-case
3. **생성** — `.claude/skills/verify-<name>/SKILL.md` 생성
4. **연관 파일 3곳 업데이트:**
   - **4a.** 이 파일의 **등록된 검증 스킬** 테이블
   - **4b.** `verify-implementation/SKILL.md`의 **실행 대상 스킬** 테이블
   - **4c.** `CLAUDE.md`의 **Skills** 테이블

### Step 7: 검증

1. 수정된 모든 SKILL.md를 다시 읽기
2. 마크다운 형식 확인
3. 깨진 파일 참조 없는지 확인
4. 탐지 명령어 드라이런
5. **등록된 검증 스킬** ↔ **실행 대상 스킬** 테이블 동기화 확인

### Step 8: 요약 보고서

```markdown
## 세션 스킬 유지보수 보고서

### 분석된 변경 파일: N개
### 업데이트된 스킬: X개
### 생성된 스킬: Y개
### 업데이트된 연관 파일:
- `manage-skills/SKILL.md`
- `verify-implementation/SKILL.md`
- `CLAUDE.md`
### 미커버 변경사항:
- `path/to/file` — 면제 (사유)
```

---

## 생성/업데이트된 스킬의 품질 기준

- **코드베이스의 실제 파일 경로** — 플레이스홀더가 아닌 실존 파일
- **작동하는 탐지 명령어** — 현재 파일과 매칭되는 실제 grep/glob 패턴
- **PASS/FAIL 기준** — 각 검사에 대해 통과와 실패의 명확한 조건
- **최소 2-3개의 현실적인 예외** — 위반이 아닌 것에 대한 설명
- **일관된 형식** — 기존 스킬과 동일한 frontmatter, 섹션 헤더, 테이블 구조

---

## Related Files

| File | Purpose |
|------|---------|
| `.claude/skills/verify-implementation/SKILL.md` | 통합 검증 스킬 (이 스킬이 실행 대상 목록을 관리) |
| `.claude/skills/manage-skills/SKILL.md` | 이 파일 자체 (등록된 검증 스킬 목록을 관리) |
| `CLAUDE.md` | 프로젝트 지침 (이 스킬이 Skills 섹션을 관리) |

## 예외사항

다음은 **문제가 아닙니다**:

1. **Lock 파일 및 생성된 파일** — `package-lock.json`, `yarn.lock` 등은 스킬 커버리지 불필요
2. **일회성 설정 변경** — 버전 범프, 린터 사소한 변경은 새 스킬 불필요
3. **문서 파일** — `README.md`, `CHANGELOG.md` 등은 코드 패턴이 아님
4. **테스트 픽스처 파일** — `fixtures/`, `test-data/` 등은 프로덕션 코드가 아님
5. **영향받지 않은 스킬** — UNAFFECTED 스킬은 검토 불필요
6. **CLAUDE.md 자체** — 문서 업데이트이며 코드 패턴이 아님
7. **벤더/서드파티 코드** — `node_modules/` 등은 외부 규칙을 따름
