// ============================================
// TodoItem 컴포넌트 — 개별 TODO 항목
// 규칙 커버: E5(뽀모 시작 버튼), E6(PascalCase), B3(토글)
// 클릭 동작: li 전체 클릭 → 활성 TODO 선택(시작X), 체크박스 → 실행중 alert 경고 후 토글
// ============================================
import { useState } from 'react';
import type { Todo } from '../types';

interface TodoItemProps {
  todo: Todo;
  isActive: boolean;
  isRunning: boolean;  // 현재 타이머가 실행 중인지
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, title: string, description?: string) => void;
  onSelectTodo: (todoId: string) => void;
  onReset: () => void;  // 실행중 TODO 완료 시 타이머 리셋
}

export default function TodoItem({
  todo,
  isActive,
  isRunning,
  onToggle,
  onDelete,
  onUpdate,
  onSelectTodo,
  onReset,
}: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editDescription, setEditDescription] = useState(todo.description ?? '');

  const handleSave = () => {
    if (!editTitle.trim()) return;
    onUpdate(todo.id, editTitle, editDescription || undefined);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(todo.title);
    setEditDescription(todo.description ?? '');
    setIsEditing(false);
  };

  // li 클릭 → 활성 TODO 선택만 (타이머 시작X)
  const handleItemClick = () => {
    if (todo.completed) return;
    // 실행 중에 다른 TODO로 전환 시 경고
    if (isRunning && !isActive) {
      if (!window.confirm('현재 진행 중인 뽀모도로가 초기화됩니다.\n다른 할 일로 전환하시겠습니까?')) return;
    }
    onSelectTodo(todo.id);
  };

  // 체크박스 클릭 → 버블링 차단
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // 체크박스 변경 → 실행중이면 alert 경고
  const handleCheckboxChange = () => {
    if (isActive && isRunning) {
      if (!window.confirm('현재 작업이 있는 경우 완료 시에는 뽀모도로 시간이 초기화됩니다.\n완료 처리 하시겠습니까?')) return;
      onToggle(todo.id);
      onReset();
      return;
    }
    onToggle(todo.id);
  };

  if (isEditing) {
    return (
      <li className="todo-item editing">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="edit-input"
          autoFocus
        />
        <input
          type="text"
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          placeholder="설명 (선택)"
          className="edit-input"
        />
        <div className="todo-actions">
          <button onClick={handleSave} className="btn btn-save">저장</button>
          <button onClick={handleCancel} className="btn btn-cancel">취소</button>
        </div>
      </li>
    );
  }

  return (
    <li
      className={`todo-item ${todo.completed ? 'completed' : ''} ${isActive ? 'active' : ''}`}
      onClick={handleItemClick}
      role="button"
      tabIndex={0}
    >
      <div className="todo-content">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={handleCheckboxChange}
          onClick={handleCheckboxClick}
          className="todo-checkbox-input"
        />
        <span className="todo-title">{todo.title}</span>
        {todo.description && (
          <p className="todo-description">{todo.description}</p>
        )}
        <span className="todo-pomodoro-count">
          🍅 {todo.completedPomodoros}
        </span>
      </div>

      <div className="todo-actions" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => setIsEditing(true)} className="btn btn-edit">✏️</button>
        <button
          onClick={() => {
            if (window.confirm('이 할 일을 삭제하시겠습니까?')) {
              onDelete(todo.id);
            }
          }}
          className="btn btn-delete"
        >
          🗑️
        </button>
      </div>
    </li>
  );
}
