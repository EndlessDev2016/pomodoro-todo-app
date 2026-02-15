## Skills

커스텀 검증 및 유지보수 스킬은 `.claude/skills/`에 정의되어 있습니다.

### 메타 스킬

| Skill | Purpose |
|-------|--------|
| `manage-skills` | 세션 변경사항을 분석하고, 검증 스킬을 생성/업데이트하며, CLAUDE.md를 관리합니다 |
| `verify-implementation` | 프로젝트의 모든 verify 스킬을 순차 실행하여 통합 검증 보고서를 생성합니다 |

### 검증 스킬

| # | Skill | Purpose |
|---|-------|--------|
| 1 | `verify-tech-stack` | 아키텍처 원칙 A1-A8 검증 |
| 2 | `verify-todo-domain` | TODO 도메인 규칙 B1-B6 검증 |
| 3 | `verify-pomodoro-domain` | 뽀모도로 도메인 C1-C7 및 TODO↔뽀모 연결 D1-D4 검증 |
| 4 | `verify-ui-conventions` | UX/동작 규칙 E1-E8 검증 |
| 5 | `verify-api-integration` | 프론트↔백엔드 연동 API-1~7 검증 |
| 6 | `verify-cross-store-sync` | 스토어 간 연동·삭제 안전성 SYNC-1~4 검증 |
| 7 | `verify-session-recording` | 뽀모도로 세션 기록·저장 SES-1~5 검증 |
| 8 | `verify-build` | 프런트·백엔드 빌드 검증 BUILD-1~4 |