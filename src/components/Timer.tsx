// ============================================
// Timer 컴포넌트 — 뽀모도로 타이머 UI
// 규칙 커버: E4(알림), E5(TODO→타이머 진입점), E6(PascalCase)
// ============================================
import { useTimerStore } from '../stores/timerStore';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);

interface TimerProps {
  activeTodoTitle: string | null;
  activeTodoPomodoros: number;
}

export default function Timer({ activeTodoTitle, activeTodoPomodoros }: TimerProps) {
  const {
    phase,
    status,
    remainingSeconds,
    completedCycles,
    activeTodoId,
    start,
    pause,
    reset,
  } = useTimerStore();

  const formatted = dayjs.duration(remainingSeconds, 'seconds').format('mm:ss');

  const phaseLabel: Record<string, string> = {
    work: '🔥 작업 중',
    shortBreak: '☕ 짧은 휴식',
    longBreak: '🌴 긴 휴식',
  };

  const handleStart = () => {
    // D1 + D2: TODO가 선택되어 있어야 시작 가능
    if (!activeTodoId) return;

    // E4: 알림 권한 요청
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    start(activeTodoId);
  };

  return (
    <div className="timer">
      <div className="timer-phase">{phaseLabel[phase]}</div>

      <div className="timer-display">{formatted}</div>

      <div className="timer-cycles">
        완료한 뽀모도로: {activeTodoId ? activeTodoPomodoros : completedCycles}회
      </div>

      {activeTodoTitle && (
        <div className="timer-active-todo">
          📌 {activeTodoTitle}
        </div>
      )}

      <div className="timer-controls">
        {status !== 'running' ? (
          <button
            onClick={handleStart}
            disabled={!activeTodoId}
            className="btn btn-start"
          >
            {status === 'paused' ? '▶ 재개' : '▶ 시작'}
          </button>
        ) : (
          <button onClick={pause} className="btn btn-pause">
            ⏸ 일시정지
          </button>
        )}
        <button onClick={reset} className="btn btn-reset">
          ⏹ 리셋
        </button>
      </div>

      {!activeTodoId && status === 'idle' && (
        <p className="timer-hint">
          아래 할 일 목록을 클릭하여 선택한 후, ▶ 시작 버튼을 눌러주세요
        </p>
      )}

      <button
        className="btn"
        style={{ marginTop: '0.5rem', fontSize: '0.8rem', opacity: 0.6 }}
        onClick={() => {
          const perm = Notification.permission;

          if (perm === 'default') {
            Notification.requestPermission().then((result) => {
              if (result === 'granted') {
                new Notification('🔔 테스트 알림', { body: '알림이 정상 작동합니다!' });
              } else {
                alert(`알림 권한이 "${result}" 상태입니다.`);
              }
            });
          } else if (perm === 'granted') {
            new Notification('🔔 테스트 알림', { body: '알림이 정상 작동합니다!' });
          } else {
            alert(`알림이 "${perm}" 상태입니다.\n주소창 🔒 → 사이트 설정 → 알림 → 허용으로 변경해주세요.`);
          }
        }}
      >
        🔔 알림 테스트
      </button>
    </div>
  );
}
