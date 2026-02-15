// ============================================
// TodoList 컴포넌트 — TODO 목록 + 입력 폼
// 규칙 커버: B1(CRUD UI), E5(타이머 시작 진입점), E6(PascalCase)
// ============================================
import { useState } from 'react';
import { useTodoStore } from '../stores/todoStore';
import { useTimerStore } from '../stores/timerStore';
import TodoItem from './TodoItem';

export default function TodoList() {
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const { todos, addTodo, updateTodo, deleteTodo, toggleTodo } = useTodoStore();
  const { activeTodoId, setActiveTodo, status, reset } = useTimerStore();

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addTodo(newTitle, newDescription || undefined);
    setNewTitle('');
    setNewDescription('');
  };

  // E9: TODO 항목 선택만 (타이머 시작X, 유저가 ▶ 시작 버튼 눌러야 시작)
  const handleSelectTodo = (todoId: string) => {
    setActiveTodo(todoId);

    // E4: 알림 권한 요청
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const incompleteTodos = todos.filter((t) => !t.completed);
  const completedTodos = todos.filter((t) => t.completed);

  return (
    <div className="todo-list">
      <form onSubmit={handleAdd} className="todo-form">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="할 일을 입력하세요"
          className="todo-input"
          required
        />
        <input
          type="text"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          placeholder="설명 (선택)"
          className="todo-input todo-input-desc"
        />
        <button type="submit" className="btn btn-add">+ 추가</button>
      </form>

      {incompleteTodos.length > 0 && (
        <ul className="todo-items">
          {incompleteTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              isActive={activeTodoId === todo.id}
              isRunning={status === 'running'}
              onToggle={toggleTodo}
              onDelete={deleteTodo}
              onUpdate={(id, title, desc) => updateTodo(id, { title, description: desc })}
              onSelectTodo={handleSelectTodo}
              onReset={reset}
            />
          ))}
        </ul>
      )}

      {incompleteTodos.length === 0 && (
        <p className="todo-empty">할 일이 없습니다. 위에서 추가해보세요! 🎉</p>
      )}

      {completedTodos.length > 0 && (
        <>
          <h3 className="section-title">완료됨 ({completedTodos.length})</h3>
          <ul className="todo-items completed-list">
            {completedTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                isActive={false}
                isRunning={false}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
                onUpdate={(id, title, desc) => updateTodo(id, { title, description: desc })}
                onSelectTodo={handleSelectTodo}
                onReset={reset}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
