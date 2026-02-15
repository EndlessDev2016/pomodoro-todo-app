// ============================================
// TODO API 라우트
// 규칙 커버: B1(CRUD), B2(title 필수 검증)
// ============================================
import { Router } from 'express';
import { randomUUID } from 'crypto';
import { TodoModel } from '../models/todo.js';

const router = Router();

// B1: Read — 전체 조회
router.get('/', (_req, res) => {
  const todos = TodoModel.findAll();
  res.json(todos.map((t) => ({ ...t, completed: Boolean(t.completed) })));
});

// B1: Create
router.post('/', (req, res) => {
  const { title, description } = req.body;

  // B2: title 필수 검증
  if (!title || !title.trim()) {
    res.status(400).json({ error: 'title은 필수입니다' });
    return;
  }

  const now = new Date().toISOString();
  const todo = {
    id: randomUUID(),
    title: title.trim(),
    description: description?.trim() || null,
    createdAt: now,
    updatedAt: now,
  };

  TodoModel.create(todo);
  res.status(201).json({ ...todo, completed: false, completedPomodoros: 0 });
});

// B1: Update
router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const existing = TodoModel.findById(id);
  if (!existing) {
    res.status(404).json({ error: 'TODO를 찾을 수 없습니다' });
    return;
  }

  const { title, description, completed } = req.body;
  if (title !== undefined && !title.trim()) {
    res.status(400).json({ error: 'title은 빈 문자열일 수 없습니다' });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title.trim();
  if (description !== undefined) updates.description = description?.trim() || null;
  if (completed !== undefined) updates.completed = completed ? 1 : 0;

  TodoModel.update(id, updates, new Date().toISOString());
  const updated = TodoModel.findById(id);
  res.json({ ...updated, completed: Boolean(updated?.completed) });
});

// B1: Delete
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  TodoModel.delete(id);
  res.status(204).send();
});

// D3: 뽀모도로 완료 시 카운트 증가
router.post('/:id/pomodoro', (req, res) => {
  const { id } = req.params;
  const existing = TodoModel.findById(id);
  if (!existing) {
    res.status(404).json({ error: 'TODO를 찾을 수 없습니다' });
    return;
  }

  TodoModel.incrementPomodoro(id, new Date().toISOString());
  const updated = TodoModel.findById(id);
  res.json({ ...updated, completed: Boolean(updated?.completed) });
});

export default router;
