// ============================================
// 서버 엔트리포인트
// 규칙 커버: A4(Node.js), A5(SQLite)
// ============================================
import express from 'express';
import cors from 'cors';
import todosRouter from './routes/todos.js';
import sessionsRouter from './routes/sessions.js';
import { initDb } from './models/db.js';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

// API 라우트
app.use('/api/todos', todosRouter);
app.use('/api/sessions', sessionsRouter);

// DB 초기화 후 서버 시작
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('DB 초기화 실패:', err);
  process.exit(1);
});
