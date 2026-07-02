"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Plus, Trash2 } from "lucide-react";

interface Todo {
  id: string;
  text: string;
  done: boolean;
  sortOrder: number;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "include",
  });
  const textRes = await res.text();
  let data: unknown = null;
  try {
    data = textRes ? JSON.parse(textRes) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    const msg =
      data && typeof data === "object" && "error" in data
        ? String((data as { error: unknown }).error)
        : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function TodoWidget() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newText, setNewText] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchTodos();
  }, []);

  async function fetchTodos() {
    try {
      const data = await api<Todo[]>("/api/admin/todos/");
      setTodos(data);
    } catch {
      // Silently fail — show empty list
    } finally {
      setLoaded(true);
    }
  }

  const addTodo = useCallback(async () => {
    const text = newText.trim();
    if (!text) return;

    // Optimistic update
    const tempId = genId();
    const optimistic: Todo = { id: tempId, text, done: false, sortOrder: todos.length };
    setTodos((prev) => [...prev, optimistic]);
    setNewText("");

    try {
      const created = await api<Todo>("/api/admin/todos/", {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      setTodos((prev) => prev.map((t) => (t.id === tempId ? created : t)));
    } catch {
      // Revert on failure
      setTodos((prev) => prev.filter((t) => t.id !== tempId));
    }
  }, [newText, todos.length]);

  const toggleTodo = useCallback(async (id: string) => {
    // Optimistic update
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
    const target = todos.find((t) => t.id === id);
    if (!target) return;

    try {
      await api(`/api/admin/todos/${encodeURIComponent(id)}/`, {
        method: "PUT",
        body: JSON.stringify({ done: !target.done }),
      });
    } catch {
      // Revert on failure
      setTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, done: target.done } : t))
      );
    }
  }, [todos]);

  const removeTodo = useCallback(async (id: string) => {
    const removed = todos.find((t) => t.id === id);
    // Optimistic update
    setTodos((prev) => prev.filter((t) => t.id !== id));

    try {
      await api(`/api/admin/todos/${encodeURIComponent(id)}/`, {
        method: "DELETE",
      });
    } catch {
      // Revert on failure
      if (removed) {
        setTodos((prev) => [...prev, removed]);
      }
    }
  }, [todos]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") addTodo();
  };

  const doneCount = todos.filter((t) => t.done).length;
  const total = todos.length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  if (!loaded) {
    return (
      <div className="card p-5 animate-pulse">
        <div className="h-4 w-20 bg-[color:var(--border)] rounded mb-3" />
        <div className="h-3 w-full bg-[color:var(--border)] rounded mb-2" />
        <div className="h-3 w-3/4 bg-[color:var(--border)] rounded" />
      </div>
    );
  }

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold tracking-tight">今日待办</h3>
        <span className="text-xs text-[color:var(--muted)]">
          {doneCount}/{total}
        </span>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="mb-4">
          <div className="h-1.5 rounded-full bg-[color:var(--border)] overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 60%, #60a5fa))",
              }}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <p className="text-[10px] text-[color:var(--muted)] mt-1 text-right">
            {pct === 100 ? "全部完成 🎉" : `完成 ${pct}%`}
          </p>
        </div>
      )}

      {/* Todo list */}
      <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-0.5">
        {todos.length === 0 ? (
          <p className="text-xs text-[color:var(--muted)]/50 py-2">暂无待办，添加一个吧</p>
        ) : (
          <AnimatePresence>
            {todos.map((todo) => (
              <motion.div
                key={todo.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2 group"
              >
                <button
                  onClick={() => toggleTodo(todo.id)}
                  className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    todo.done
                      ? "bg-[color:var(--accent)] border-[color:var(--accent)]"
                      : "border-[color:var(--border)] hover:border-[color:var(--accent)]"
                  }`}
                >
                  {todo.done && <Check size={10} className="text-black" />}
                </button>
                <span
                  className={`text-xs flex-1 leading-relaxed transition-colors ${
                    todo.done
                      ? "line-through text-[color:var(--muted)]/50"
                      : "text-[color:var(--text)]"
                  }`}
                >
                  {todo.text}
                </span>
                <button
                  onClick={() => removeTodo(todo.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-[color:var(--muted)] hover:text-red-400"
                >
                  <Trash2 size={12} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Add input */}
      <div className="mt-3 flex items-center gap-2">
        <input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="添加待办..."
          className="flex-1 text-xs bg-transparent border-b border-[color:var(--border)] py-1.5 outline-none focus:border-[color:var(--accent)] transition-colors placeholder:text-[color:var(--muted)]/50"
        />
        <button
          onClick={addTodo}
          disabled={!newText.trim()}
          className="flex-shrink-0 p-1 rounded text-[color:var(--muted)] hover:text-[color:var(--accent)] disabled:opacity-30 transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
