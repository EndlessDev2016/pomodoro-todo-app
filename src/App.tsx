// ============================================
// App 컴포넌트 — 메인 레이아웃
// 규칙 커버: E1(반응형), E7(심플 UI), API-1(초기 로딩)
// ============================================
import { useEffect } from 'react';
import { useTodoStore } from './stores/todoStore';
import { useTimerStore } from './stores/timerStore';
import Timer from './components/Timer';
import TodoList from './components/TodoList';
import './App.css';

function App() {
  const todos = useTodoStore((s) => s.todos);
  const fetchTodos = useTodoStore((s) => s.fetchTodos);
  const activeTodoId = useTimerStore((s) => s.activeTodoId);

  // API-1: 앱 마운트 시 서버에서 TODO 목록 로딩
  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const activeTodoTitle = activeTodoId
    ? todos.find((t) => t.id === activeTodoId)?.title ?? null
    : null;

  return (
    <div className="app">
      <header className="app-header">
        <h1>🍅 뽀모도로 TODO</h1>
      </header>

      <main className="app-main">
        <section className="timer-section">
          <Timer activeTodoTitle={activeTodoTitle} />
        </section>

        <section className="todo-section">
          <h2>할 일 목록</h2>
          <TodoList />
        </section>
      </main>
    </div>
  );
}

export default App;
