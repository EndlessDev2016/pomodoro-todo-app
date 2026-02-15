// ============================================
// TODO DB 모델
// 규칙 커버: B1-B4 (프론트-백엔드 일관성)
// ============================================
import { getDb, saveDb } from './db.js';

export interface TodoRow {
  id: string;
  title: string;
  description: string | null;
  completed: number; // SQLite: 0 or 1
  completedPomodoros: number;
  createdAt: string;
  updatedAt: string;
}

export const TodoModel = {
  findAll: (): TodoRow[] => {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM todos ORDER BY createdAt DESC');
    const rows: TodoRow[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject() as unknown as TodoRow);
    }
    stmt.free();
    return rows;
  },

  findById: (id: string): TodoRow | undefined => {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM todos WHERE id = ?');
    stmt.bind([id]);
    const row = stmt.step() ? (stmt.getAsObject() as unknown as TodoRow) : undefined;
    stmt.free();
    return row;
  },

  create: (todo: Omit<TodoRow, 'completed' | 'completedPomodoros'> & { completed?: number; completedPomodoros?: number }) => {
    const db = getDb();
    db.run(
      'INSERT INTO todos (id, title, description, completed, completedPomodoros, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [todo.id, todo.title, todo.description ?? null, todo.completed ?? 0, todo.completedPomodoros ?? 0, todo.createdAt, todo.updatedAt],
    );
    saveDb();
  },

  update: (id: string, updates: Partial<Pick<TodoRow, 'title' | 'description' | 'completed' | 'completedPomodoros'>>, updatedAt: string) => {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title); }
    if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
    if (updates.completed !== undefined) { fields.push('completed = ?'); values.push(updates.completed); }
    if (updates.completedPomodoros !== undefined) { fields.push('completedPomodoros = ?'); values.push(updates.completedPomodoros); }

    fields.push('updatedAt = ?');
    values.push(updatedAt);
    values.push(id);

    const db = getDb();
    db.run(`UPDATE todos SET ${fields.join(', ')} WHERE id = ?`, values);
    saveDb();
  },

  delete: (id: string) => {
    const db = getDb();
    db.run('DELETE FROM todos WHERE id = ?', [id]);
    saveDb();
  },

  incrementPomodoro: (id: string, updatedAt: string) => {
    const db = getDb();
    db.run('UPDATE todos SET completedPomodoros = completedPomodoros + 1, updatedAt = ? WHERE id = ?', [updatedAt, id]);
    saveDb();
  },
};
