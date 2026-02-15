// ============================================
// 타이머 상태 API 라우트
// 규칙 커버: SYNC-T3 (서버 시간 기준 타이머 동기화)
// ============================================
import { Router } from 'express';
import { TimerModel } from '../models/timer.js';

const router = Router();

// SYNC-T3: GET — 현재 타이머 상태 조회 (서버 시간 기준 남은 시간 계산)
router.get('/', (_req, res) => {
  const state = TimerModel.get();

  // running 상태이면 서버 시간 기준으로 경과시간 차감
  if (state.status === 'running' && state.startedAt) {
    const elapsed = Math.floor((Date.now() - new Date(state.startedAt).getTime()) / 1000);
    const adjusted = Math.max(0, state.remainingSeconds - elapsed);

    res.json({
      ...state,
      remainingSeconds: adjusted,
      // 시간이 0 이하이면 클라이언트가 onPhaseComplete 처리 필요
      expired: adjusted <= 0,
    });
    return;
  }

  res.json({ ...state, expired: false });
});

// SYNC-T3: PUT — 타이머 상태 저장
router.put('/', (req, res) => {
  const { phase, status, remainingSeconds, completedCycles, activeTodoId, activeSessionId } = req.body;

  // running으로 전환될 때 서버 시간으로 startedAt 기록
  const startedAt = status === 'running'
    ? new Date().toISOString()
    : null;

  const state = {
    phase: phase ?? 'work',
    status: status ?? 'idle',
    remainingSeconds: remainingSeconds ?? 1500,
    startedAt,
    completedCycles: completedCycles ?? 0,
    activeTodoId: activeTodoId ?? null,
    activeSessionId: activeSessionId ?? null,
  };

  TimerModel.upsert(state);
  res.json({ ...state, id: 'singleton' });
});

export default router;
