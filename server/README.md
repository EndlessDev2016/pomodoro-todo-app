# 🍅 뽀모도로 TODO — 백엔드

뽀모도로 TODO 앱의 **백엔드 REST API 서버**입니다.

## 기술 스택

| 분류 | 기술 |
|------|------|
| 런타임 | Node.js |
| 프레임워크 | Express 4 |
| 언어 | TypeScript 5.9 |
| 데이터베이스 | SQLite (sql.js) |
| 실행 도구 | tsx (dev: watch 모드) |
| CORS | cors 미들웨어 |

## 프로젝트 구조

```
server/
├── package.json
├── tsconfig.json
├── data/                     # SQLite DB 파일 (자동 생성)
│   └── pomodoro.db
└── src/
    ├── index.ts              # 서버 엔트리포인트 (Express 앱 설정)
    ├── models/
    │   ├── db.ts             # SQLite 초기화 및 DB 관리
    │   ├── todo.ts           # TODO 데이터 모델
    │   └── session.ts        # 뽀모도로 세션 데이터 모델
    ├── routes/
    │   ├── todos.ts          # /api/todos 라우트 핸들러
    │   └── sessions.ts       # /api/sessions 라우트 핸들러
    └── types/
        └── sql.js.d.ts       # sql.js 타입 선언
```

## API 엔드포인트

### TODO (`/api/todos`)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/todos` | 전체 TODO 목록 조회 |
| `POST` | `/api/todos` | 새 TODO 생성 (`title` 필수) |
| `PATCH` | `/api/todos/:id` | TODO 수정 (title, description, completed) |
| `DELETE` | `/api/todos/:id` | TODO 삭제 |
| `POST` | `/api/todos/:id/pomodoro` | 뽀모도로 완료 카운트 증가 |

### 뽀모도로 세션 (`/api/sessions`)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/sessions` | 전체 세션 조회 (`?todoId=` 필터 가능) |
| `POST` | `/api/sessions` | 새 세션 생성 (`todoId`, `phase` 필수) |
| `PATCH` | `/api/sessions/:id/complete` | 세션 완료 처리 |

## 데이터 모델

### todos 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | TEXT (PK) | UUID |
| `title` | TEXT (NOT NULL) | 할 일 제목 |
| `description` | TEXT | 설명 (선택) |
| `completed` | INTEGER | 완료 여부 (0/1) |
| `completedPomodoros` | INTEGER | 완료 뽀모도로 수 |
| `createdAt` | TEXT | 생성일 (ISO 8601) |
| `updatedAt` | TEXT | 수정일 (ISO 8601) |

### pomodoro_sessions 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | TEXT (PK) | UUID |
| `todoId` | TEXT (FK) | 연결된 TODO ID |
| `phase` | TEXT | 페이즈 (work / shortBreak / longBreak) |
| `startedAt` | TEXT | 시작 시간 (ISO 8601) |
| `completedAt` | TEXT | 완료 시간 (ISO 8601, nullable) |

## 시작하기

### 사전 요구 사항

- Node.js 18+
- npm 또는 yarn

### 설치 및 실행

```bash
cd server

# 의존성 설치
npm install

# 개발 서버 실행 (watch 모드, 기본 포트: 3001)
npm run dev

# 프로덕션 실행
npm start
```

### 환경 변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `PORT` | `3001` | 서버 포트 |

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | tsx watch 모드로 개발 서버 실행 (파일 변경 시 자동 재시작) |
| `npm start` | tsx로 프로덕션 서버 실행 |

## 데이터베이스

- SQLite 데이터베이스는 `server/data/pomodoro.db` 에 파일로 저장됩니다.
- 서버 시작 시 DB 파일이 없으면 자동으로 생성됩니다.
- `data/` 디렉토리가 없으면 자동으로 생성됩니다.
- DB 변경 시마다 파일에 자동 persist 됩니다.

## 관련 문서

- 프런트엔드: [`../README.md`](../README.md)
- 프로젝트 검증 스킬: [`../CLAUDE.md`](../CLAUDE.md)
