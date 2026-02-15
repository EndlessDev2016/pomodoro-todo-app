// ============================================
// TODO Zustand Store
// 규칙 커버: B1(CRUD+토글), B2(title 필수), B3(completed 토글), B4(completedPomodoros)
// API 연동: API-1~7 (낙관적 업데이트 + 에러 롤백)
// ============================================
import { create } from 'zustand';
import type { Todo } from '../types';
import { useTimerStore } from './timerStore';

const API_BASE = '/api/todos';

interface TodoState {
  todos: Todo[];
  fetchTodos: () => Promise<void>;
  addTodo: (title: string, description?: string) => Promise<void>;
  updateTodo: (id: string, updates: Partial<Pick<Todo, 'title' | 'description'>>) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  toggleTodo: (id: string) => Promise<void>;
  incrementPomodoro: (id: string) => Promise<void>;
}

export const useTodoStore = create<TodoState>((set, get) => ({
  todos: [],

  // API-1: 초기 데이터 로딩
  fetchTodos: async () => {
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error(`GET 실패: ${res.status}`);
      const todos: Todo[] = await res.json();
      set({ todos });
    } catch (err) {
      console.error('TODO 목록 로딩 실패:', err);
    }
  },

  // B1 + API-2: Create
  addTodo: async (title: string, description?: string) => {
    // B2: title 필수 — 빈 문자열 가드
    if (!title.trim()) return;

    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description: description?.trim() || undefined }),
      });
      if (!res.ok) throw new Error(`POST 실패: ${res.status}`);
      const newTodo: Todo = await res.json();
      set((state) => ({ todos: [...state.todos, newTodo] }));
    } catch (err) {
      console.error('TODO 추가 실패:', err);
    }
  },

  // B1 + API-3: Update
  updateTodo: async (id: string, updates: Partial<Pick<Todo, 'title' | 'description'>>) => {
    if (updates.title !== undefined && !updates.title.trim()) return;

    const prev = get().todos;
    // 낙관적 업데이트
    set((state) => ({
      todos: state.todos.map((todo) =>
        todo.id === id
          ? { ...todo, ...updates, title: updates.title?.trim() ?? todo.title }
          : todo,
      ),
    }));

    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error(`PATCH 실패: ${res.status}`);
      const updated: Todo = await res.json();
      set((state) => ({
        todos: state.todos.map((todo) => (todo.id === id ? updated : todo)),
      }));
    } catch (err) {
      console.error('TODO 수정 실패:', err);
      set({ todos: prev }); // 롤백
    }
  },

  // B1 + API-4 + SYNC-1: Delete — 바인딩된 TODO 삭제 시 타이머 리셋
  deleteTodo: async (id: string) => {
    const timerState = useTimerStore.getState();
    if (timerState.activeTodoId === id) {
      timerState.reset();
    }

    const prev = get().todos;
    // 낙관적 업데이트
    set((state) => ({ todos: state.todos.filter((todo) => todo.id !== id) }));

    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`DELETE 실패: ${res.status}`);
    } catch (err) {
      console.error('TODO 삭제 실패:', err);
      set({ todos: prev }); // 롤백
    }
  },

  // B1 + B3 + API-5: Toggle completed (boolean 반전)
  toggleTodo: async (id: string) => {
    const todo = get().todos.find((t) => t.id === id);
    if (!todo) return;

    const prev = get().todos;
    const newCompleted = !todo.completed;
    // 낙관적 업데이트
    set((state) => ({
      todos: state.todos.map((t) =>
        t.id === id ? { ...t, completed: newCompleted } : t,
      ),
    }));

    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: newCompleted }),
      });
      if (!res.ok) throw new Error(`PATCH 실패: ${res.status}`);
      const updated: Todo = await res.json();
      set((state) => ({
        todos: state.todos.map((t) => (t.id === id ? updated : t)),
      }));
    } catch (err) {
      console.error('TODO 토글 실패:', err);
      set({ todos: prev }); // 롤백
    }
  },

  // B4 + D3 + API-6: 뽀모도로 완료 시 카운트 +1
  incrementPomodoro: async (id: string) => {
    const prev = get().todos;
    // 낙관적 업데이트
    set((state) => ({
      todos: state.todos.map((todo) =>
        todo.id === id
          ? { ...todo, completedPomodoros: todo.completedPomodoros + 1 }
          : todo,
      ),
    }));

    try {
      const res = await fetch(`${API_BASE}/${id}/pomodoro`, { method: 'POST' });
      if (!res.ok) throw new Error(`POST pomodoro 실패: ${res.status}`);
      const updated: Todo = await res.json();
      set((state) => ({
        todos: state.todos.map((todo) => (todo.id === id ? updated : todo)),
      }));
    } catch (err) {
      console.error('뽀모도로 카운트 증가 실패:', err);
      set({ todos: prev }); // 롤백
    }
  },
}));
