// ============================================
// 뽀모도로 세션 API 라우트
// 규칙 커버: SES-3, SES-4 (세션 Create + Read + Complete)
// ============================================
import { Router } from 'express';
import { randomUUID } from 'crypto';
import { SessionModel } from '../models/session.js';

const router = Router();

// SES-4: Read — 전체 세션 조회 (선택: ?todoId= 필터)
router.get('/', (req, res) => {
  const { todoId } = req.query;
  const sessions = todoId
    ? SessionModel.findByTodoId(todoId as string)
    : SessionModel.findAll();
  res.json(sessions);
});

// SES-4: Create — 새 세션 생성
router.post('/', (req, res) => {
  const { todoId, phase } = req.body;

  if (!todoId || !phase) {
    res.status(400).json({ error: 'todoId와 phase는 필수입니다' });
    return;
  }

  const session = {
    id: randomUUID(),
    todoId,
    phase,
    startedAt: new Date().toISOString(),
  };

  SessionModel.create(session);
  res.status(201).json({ ...session, completedAt: null });
});

// SES-4: Complete — 세션 완료 처리
router.patch('/:id/complete', (req, res) => {
  const { id } = req.params;
  const existing = SessionModel.findById(id);
  if (!existing) {
    res.status(404).json({ error: '세션을 찾을 수 없습니다' });
    return;
  }

  const completedAt = new Date().toISOString();
  SessionModel.complete(id, completedAt);
  res.json({ ...existing, completedAt });
});

export default router;
