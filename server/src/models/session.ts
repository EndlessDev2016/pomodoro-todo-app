// ============================================
// 뽀모도로 세션 DB 모델
// 규칙 커버: SES-3, SES-5 (세션 CRUD)
// ============================================
import { getDb, saveDb } from './db.js';

export interface SessionRow {
  id: string;
  todoId: string;
  phase: string;
  startedAt: string;
  completedAt: string | null;
}

export const SessionModel = {
  findAll: (): SessionRow[] => {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM pomodoro_sessions ORDER BY startedAt DESC');
    const rows: SessionRow[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject() as unknown as SessionRow);
    }
    stmt.free();
    return rows;
  },

  findByTodoId: (todoId: string): SessionRow[] => {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM pomodoro_sessions WHERE todoId = ? ORDER BY startedAt DESC');
    stmt.bind([todoId]);
    const rows: SessionRow[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject() as unknown as SessionRow);
    }
    stmt.free();
    return rows;
  },

  findById: (id: string): SessionRow | undefined => {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM pomodoro_sessions WHERE id = ?');
    stmt.bind([id]);
    const row = stmt.step() ? (stmt.getAsObject() as unknown as SessionRow) : undefined;
    stmt.free();
    return row;
  },

  create: (session: Omit<SessionRow, 'completedAt'> & { completedAt?: string | null }) => {
    const db = getDb();
    db.run(
      'INSERT INTO pomodoro_sessions (id, todoId, phase, startedAt, completedAt) VALUES (?, ?, ?, ?, ?)',
      [session.id, session.todoId, session.phase, session.startedAt, session.completedAt ?? null],
    );
    saveDb();
  },

  complete: (id: string, completedAt: string) => {
    const db = getDb();
    db.run('UPDATE pomodoro_sessions SET completedAt = ? WHERE id = ?', [completedAt, id]);
    saveDb();
  },
};
