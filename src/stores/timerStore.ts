// ============================================
// 뽀모도로 타이머 Zustand Store
// 규칙 커버: C1-C6(타이머 상수/사이클), D1-D3(패턴A 바인딩)
// 세션 기록: SES-1~3 (세션 생성/완료/API 연동)
// 서버 동기화: SYNC-T4, SYNC-T5 (서버 사이드 타이머 상태 저장/복원)
// ============================================
import { create } from 'zustand';
import type { TimerPhase, TimerStatus } from '../types';
import { useTodoStore } from './todoStore';

// C1-C4: 뽀모도로 기본 상수
const WORK_DURATION = 25 * 60;       // C1: 25분 = 1500초
const SHORT_BREAK_DURATION = 5 * 60; // C2: 5분 = 300초
const LONG_BREAK_DURATION = 15 * 60; // C3: 15분 = 900초
const LONG_BREAK_INTERVAL = 4;       // C4: 4 뽀모도로 후 긴 휴식

const SESSION_API = '/api/sessions';
const TIMER_API = '/api/timer';

interface TimerState {
  // 상태
  phase: TimerPhase;
  status: TimerStatus;
  remainingSeconds: number;
  completedCycles: number;
  activeTodoId: string | null;
  activeSessionId: string | null;  // SES-1: 현재 세션 ID
  intervalId: number | null;

  // C5: 3개 필수 액션
  start: (todoId: string) => void;  // D1: todoId 필수 파라미터
  pause: () => void;
  reset: () => void;

  // E9: TODO 선택만 (타이머 시작하지 않음)
  setActiveTodo: (todoId: string) => void;

  // 내부 액션
  tick: () => void;
  onPhaseComplete: () => void;

  // SYNC-T4: 서버에서 타이머 상태 복원
  fetchTimerState: () => Promise<void>;

  // SYNC-T5: 서버에 타이머 상태 전송
  syncToServer: () => void;
}

function getDuration(phase: TimerPhase): number {
  switch (phase) {
    case 'work':       return WORK_DURATION;
    case 'shortBreak': return SHORT_BREAK_DURATION;
    case 'longBreak':  return LONG_BREAK_DURATION;
  }
}

export const useTimerStore = create<TimerState>()((set, get) => ({
  phase: 'work',
  status: 'idle',
  remainingSeconds: WORK_DURATION,
  completedCycles: 0,
  activeTodoId: null,
  activeSessionId: null,
  intervalId: null,

  // SYNC-T4: 앱 로드 시 서버에서 타이머 상태 복원
  fetchTimerState: async () => {
    try {
      const res = await fetch(TIMER_API);
      if (!res.ok) throw new Error(`GET timer 실패: ${res.status}`);
      const data = await res.json();

      const phase = data.phase as TimerPhase;
      const status = data.status as TimerStatus;
      const remainingSeconds = data.remainingSeconds as number;

      // 서버에서 expired=true면 페이즈 완료 처리 필요
      if (data.expired && status === 'running') {
        set({
          phase,
          status: 'idle',
          remainingSeconds: 0,
          completedCycles: data.completedCycles ?? 0,
          activeTodoId: data.activeTodoId ?? null,
          activeSessionId: data.activeSessionId ?? null,
          intervalId: null,
        });
        // 페이즈 완료 트리거
        get().onPhaseComplete();
        return;
      }

      set({
        phase,
        status: status === 'running' ? 'paused' : status,
        remainingSeconds,
        completedCycles: data.completedCycles ?? 0,
        activeTodoId: data.activeTodoId ?? null,
        activeSessionId: data.activeSessionId ?? null,
        intervalId: null,
      });

      // running이었으면 자동으로 타이머 재개
      if (status === 'running' && remainingSeconds > 0) {
        const todoId = data.activeTodoId;
        if (todoId) {
          const id = window.setInterval(() => {
            get().tick();
          }, 1000);
          set({ status: 'running', intervalId: id });
        }
      }
    } catch (err) {
      console.error('타이머 상태 복원 실패:', err);
    }
  },

  // SYNC-T5: 서버에 현재 상태 전송 (fire-and-forget)
  syncToServer: () => {
    const state = get();
    fetch(TIMER_API, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phase: state.phase,
        status: state.status,
        remainingSeconds: state.remainingSeconds,
        completedCycles: state.completedCycles,
        activeTodoId: state.activeTodoId,
        activeSessionId: state.activeSessionId,
      }),
    }).catch((err) => console.error('타이머 동기화 실패:', err));
  },

  // E9: TODO 선택만 (타이머 시작하지 않음, TOP에 셋팅)
  setActiveTodo: (todoId: string) => {
    const state = get();
    // 이미 같은 TODO가 선택되어 있으면 무시
    if (state.activeTodoId === todoId) return;
    // 실행 중이면 리셋 후 선택
    if (state.status === 'running') {
      if (state.intervalId) clearInterval(state.intervalId);
      set({
        phase: 'work',
        status: 'idle',
        remainingSeconds: WORK_DURATION,
        completedCycles: 0,
        activeTodoId: todoId,
        activeSessionId: null,
        intervalId: null,
      });
    } else {
      set({
        phase: 'work',
        status: 'idle',
        remainingSeconds: WORK_DURATION,
        completedCycles: 0,
        activeTodoId: todoId,
        activeSessionId: null,
      });
    }
    get().syncToServer();
  },

  // C5 + D1 + D2: 시작 — 반드시 todoId가 있어야 함 (패턴 A)
  start: (todoId: string) => {
    const state = get();

    // D2: TODO 미선택 상태에서 시작 불가 (가드)
    if (!todoId) {
      console.warn('뽀모도로를 시작하려면 TODO를 선택해야 합니다.');
      return;
    }

    // 이미 실행 중이면 무시
    if (state.status === 'running') return;

    // paused 상태에서 재개할 때는 기존 남은 시간 유지
    const remaining = state.status === 'paused'
      ? state.remainingSeconds
      : getDuration(state.phase);

    const id = window.setInterval(() => {
      get().tick();
    }, 1000);

    set({
      status: 'running',
      activeTodoId: todoId,
      remainingSeconds: remaining,
      intervalId: id,
    });

    // SYNC-T5: 서버에 running 상태 전송
    get().syncToServer();

    // SES-1 + SES-3: work 페이즈 새로 시작 시 세션 생성 + API 전송
    if (state.status !== 'paused' && state.phase === 'work') {
      fetch(SESSION_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ todoId, phase: 'work' }),
      })
        .then((res) => res.ok ? res.json() : Promise.reject(res.status))
        .then((session) => {
          set({ activeSessionId: session.id });
          get().syncToServer(); // 세션 ID 포함하여 재동기화
        })
        .catch((err) => console.error('세션 생성 실패:', err));
    }
  },

  // C5: 일시정지
  pause: () => {
    const state = get();
    if (state.intervalId) {
      clearInterval(state.intervalId);
    }
    set({ status: 'paused', intervalId: null });

    // SYNC-T5: 서버에 paused 상태 전송
    get().syncToServer();
  },

  // C5: 리셋
  reset: () => {
    const state = get();
    if (state.intervalId) {
      clearInterval(state.intervalId);
    }
    set({
      phase: 'work',
      status: 'idle',
      remainingSeconds: WORK_DURATION,
      completedCycles: 0,
      activeTodoId: null,
      activeSessionId: null,
      intervalId: null,
    });

    // SYNC-T5: 서버에 idle 상태 전송
    get().syncToServer();
  },

  // 1초마다 호출
  tick: () => {
    const state = get();
    if (state.remainingSeconds <= 1) {
      state.onPhaseComplete();
    } else {
      set({ remainingSeconds: state.remainingSeconds - 1 });
    }
  },

  // C6: 페이즈 완료 시 자동 전환
  onPhaseComplete: () => {
    const state = get();

    if (state.intervalId) {
      clearInterval(state.intervalId);
    }

    // E4: 알림 — 브라우저 Notification
    if (Notification.permission === 'granted') {
      const message = state.phase === 'work'
        ? '작업 완료! 휴식 시간입니다 ☕'
        : '휴식 끝! 다시 집중할 시간입니다 🔥';
      new Notification('뽀모도로 타이머', { body: message });
    }

    // 알림 — 소리
    try {
      const audio = new Audio('/notification.mp3');
      audio.play().catch(() => { /* 사운드 파일 없어도 무시 */ });
    } catch {
      // 오디오 재생 실패 시 무시
    }

    if (state.phase === 'work') {
      // D2 / SYNC-3: 작업 완료 시 해당 TODO의 뽀모도로 카운트 +1
      if (state.activeTodoId) {
        useTodoStore.getState().incrementPomodoro(state.activeTodoId);
      }

      // SES-2 + SES-3: 세션 완료 처리 + API 전송
      if (state.activeSessionId) {
        fetch(`${SESSION_API}/${state.activeSessionId}/complete`, { method: 'PATCH' })
          .catch((err) => console.error('세션 완료 처리 실패:', err));
      }

      const newCycles = state.completedCycles + 1;

      // C6 + C4: 4회 완료 후 긴 휴식, 아니면 짧은 휴식
      const nextPhase: TimerPhase = newCycles % LONG_BREAK_INTERVAL === 0
        ? 'longBreak'
        : 'shortBreak';

      set({
        phase: nextPhase,
        status: 'idle',
        remainingSeconds: getDuration(nextPhase),
        completedCycles: newCycles,
        activeSessionId: null,
        intervalId: null,
      });
    } else {
      // 휴식 완료 → 작업 모드로 복귀
      set({
        phase: 'work',
        status: 'idle',
        remainingSeconds: WORK_DURATION,
        activeSessionId: null,
        intervalId: null,
      });
    }

    // SYNC-T5: 서버에 전환된 상태 전송
    get().syncToServer();
  },
}));
