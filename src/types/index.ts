// ============================================
// 뽀모도로 TODO 앱 — 타입 정의
// ============================================

/** TODO 아이템 */
export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  completedPomodoros: number;
  createdAt: string;
  updatedAt: string;
}

/** 뽀모도로 타이머 페이즈 */
export type TimerPhase = 'work' | 'shortBreak' | 'longBreak';

/** 뽀모도로 세션 기록 */
export interface PomodoroSession {
  id: string;
  todoId: string;
  phase: TimerPhase;
  startedAt: string;
  completedAt?: string;
}

/** 타이머 상태 */
export type TimerStatus = 'idle' | 'running' | 'paused';
