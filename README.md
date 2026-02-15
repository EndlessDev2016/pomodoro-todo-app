# 🍅 뽀모도로 TODO — 프런트엔드

뽀모도로 타이머와 TODO 관리를 결합한 생산성 웹 애플리케이션의 **프런트엔드** 프로젝트입니다.

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | React 19 |
| 언어 | TypeScript 5.9 |
| 빌드 | Vite 7 |
| 상태 관리 | Zustand 5 |
| 날짜 처리 | Day.js |
| 린팅 | ESLint 9 + typescript-eslint |

## 프로젝트 구조

```
src/
├── App.tsx               # 메인 레이아웃 컴포넌트
├── main.tsx              # 앱 엔트리포인트
├── App.css / index.css   # 스타일
├── components/
│   ├── Timer.tsx          # 뽀모도로 타이머 UI
│   ├── TodoList.tsx       # TODO 목록 UI
│   └── TodoItem.tsx       # 개별 TODO 아이템 UI
├── stores/
│   ├── timerStore.ts      # 타이머 Zustand Store (start/pause/reset)
│   └── todoStore.ts       # TODO Zustand Store (CRUD + 낙관적 업데이트)
├── types/
│   └── index.ts           # 공유 타입 정의 (Todo, TimerPhase, PomodoroSession 등)
└── assets/
```

## 주요 기능

### TODO 관리
- **CRUD** — 할 일 추가 / 수정 / 삭제
- **토글** — 완료 상태 전환
- **뽀모도로 카운트** — 완료된 뽀모도로 수 표시

### 뽀모도로 타이머
- ⏱ **작업 25분** → ☕ **짧은 휴식 5분** → 4사이클 후 🛋 **긴 휴식 15분**
- **시작 / 일시정지 / 리셋** 3가지 액션
- TODO와 연동 — TODO를 선택해야 타이머 시작 가능
- 세션 기록을 서버에 자동 저장

### API 연동
- 앱 마운트 시 서버에서 TODO 목록 자동 로딩
- 낙관적 업데이트 + 실패 시 롤백
- Vite 프록시를 통해 `/api` → `http://localhost:3001` 으로 프록시

## 시작하기

### 사전 요구 사항

- Node.js 18+
- npm 또는 yarn
- 백엔드 서버가 실행 중이어야 합니다 (`server/` 디렉토리 참조)

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (기본 포트: 5173)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview

# ESLint 실행
npm run lint
```

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | Vite 개발 서버 실행 (HMR) |
| `npm run build` | TypeScript 빌드 + Vite 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 로컬 미리보기 |
| `npm run lint` | ESLint 린트 실행 |

## 환경 설정

개발 서버는 Vite 프록시를 사용하여 API 요청을 백엔드로 전달합니다:

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
    },
  },
}
```

## 관련 문서

- 백엔드: [`server/README.md`](server/README.md)
- 프로젝트 검증 스킬: [`CLAUDE.md`](CLAUDE.md)
