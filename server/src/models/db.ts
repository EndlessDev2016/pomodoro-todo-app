// ============================================
// 백엔드 DB 초기화 — SQLite via sql.js (A5)
// ============================================
import initSqlJs, { type Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', '..', 'data');
const dbPath = path.join(dataDir, 'pomodoro.db');

let db: Database;

export async function initDb(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs();

  // 기존 DB 파일이 있으면 로드, 없으면 새로 생성
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    db = new SQL.Database();
  }

  // 테이블 생성
  db.run(`
    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      completed INTEGER NOT NULL DEFAULT 0,
      completedPomodoros INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS pomodoro_sessions (
      id TEXT PRIMARY KEY,
      todoId TEXT NOT NULL,
      phase TEXT NOT NULL,
      startedAt TEXT NOT NULL,
      completedAt TEXT,
      FOREIGN KEY (todoId) REFERENCES todos(id) ON DELETE CASCADE
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS timer_state (
      id TEXT PRIMARY KEY DEFAULT 'singleton',
      phase TEXT NOT NULL DEFAULT 'work',
      status TEXT NOT NULL DEFAULT 'idle',
      remainingSeconds INTEGER NOT NULL DEFAULT 1500,
      startedAt TEXT,
      completedCycles INTEGER NOT NULL DEFAULT 0,
      activeTodoId TEXT,
      activeSessionId TEXT
    );
  `);

  saveDb();
  return db;
}

export function getDb(): Database {
  if (!db) throw new Error('DB가 초기화되지 않았습니다. initDb()를 먼저 호출하세요.');
  return db;
}

export function saveDb(): void {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(dbPath, buffer);
}

export default db!;
