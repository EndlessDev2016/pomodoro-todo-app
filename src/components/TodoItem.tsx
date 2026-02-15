// ============================================
// TodoItem 컴포넌트 — 개별 TODO 항목
// 규칙 커버: E5(뽀모 시작 버튼), E6(PascalCase), B3(토글)
// ============================================
import { useState } from 'react';
import type { Todo } from '../types';

interface TodoItemProps {
  todo: Todo;
  isActive: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, title: string, description?: string) => void;
  onStartPomodoro: (todoId: string) => void;
}

export default function TodoItem({
  todo,
  isActive,
  onToggle,
  onDelete,
  onUpdate,
  onStartPomodoro,
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
    <li className={`todo-item ${todo.completed ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
      <div className="todo-content">
        <label className="todo-checkbox">
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => onToggle(todo.id)}
          />
          <span className="todo-title">{todo.title}</span>
        </label>
        {todo.description && (
          <p className="todo-description">{todo.description}</p>
        )}
        <span className="todo-pomodoro-count">
          🍅 {todo.completedPomodoros}
        </span>
      </div>

      <div className="todo-actions">
        {/* E5: TODO 항목에서 뽀모도로 시작 진입점 */}
        {!todo.completed && (
          <button
            onClick={() => onStartPomodoro(todo.id)}
            className="btn btn-pomodoro"
            title="이 할 일로 뽀모도로 시작"
          >
            ▶
          </button>
        )}
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
