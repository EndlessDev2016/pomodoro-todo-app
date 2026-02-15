// ============================================
// 타이머 상태 DB 모델
// 규칙 커버: SYNC-T1, SYNC-T2 (서버 사이드 타이머 상태 저장)
// 단일 레코드(singleton)로 현재 타이머 상태를 관리
// ============================================
import { getDb, saveDb } from './db.js';

export interface TimerRow {
  id: string;
  phase: string;        // 'work' | 'shortBreak' | 'longBreak'
  status: string;       // 'idle' | 'running' | 'paused'
  remainingSeconds: number;
  startedAt: string | null;   // running 상태일 때의 시작 시각 (ISO)
  completedCycles: number;
  activeTodoId: string | null;
  activeSessionId: string | null;
}

const SINGLETON_ID = 'singleton';

export const TimerModel = {
  /** 현재 타이머 상태 조회 (없으면 기본값 반환) */
  get: (): TimerRow => {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM timer_state WHERE id = ?');
    stmt.bind([SINGLETON_ID]);
    const row = stmt.step() ? (stmt.getAsObject() as unknown as TimerRow) : null;
    stmt.free();

    if (row) return row;

    // 최초 호출 시 기본값 삽입
    const defaultRow: TimerRow = {
      id: SINGLETON_ID,
      phase: 'work',
      status: 'idle',
      remainingSeconds: 1500,
      startedAt: null,
      completedCycles: 0,
      activeTodoId: null,
      activeSessionId: null,
    };
    TimerModel.upsert(defaultRow);
    return defaultRow;
  },

  /** 타이머 상태 저장 (INSERT OR REPLACE) */
  upsert: (state: Omit<TimerRow, 'id'> & { id?: string }) => {
    const db = getDb();
    db.run(
      `INSERT OR REPLACE INTO timer_state
        (id, phase, status, remainingSeconds, startedAt, completedCycles, activeTodoId, activeSessionId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        SINGLETON_ID,
        state.phase,
        state.status,
        state.remainingSeconds,
        state.startedAt ?? null,
        state.completedCycles,
        state.activeTodoId ?? null,
        state.activeSessionId ?? null,
      ],
    );
    saveDb();
  },
};
