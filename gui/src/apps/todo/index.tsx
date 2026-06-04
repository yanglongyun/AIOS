import { useEffect, useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { appFetch } from "../lib";

type Todo = { id: number; text: string; done: boolean; created_at: string };

const BASE = "/apps/todo/todos";

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const refresh = async () => {
    try {
      const { todos: list } = await appFetch<{ todos: Todo[] }>(BASE);
      setTodos(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const add = async () => {
    const value = text.trim();
    if (!value) return;
    try {
      await appFetch(BASE, { method: "POST", body: JSON.stringify({ text: value }) });
      setText("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "添加失败");
    }
  };

  const toggle = async (todo: Todo) => {
    try {
      await appFetch(`${BASE}?id=${todo.id}`, { method: "PATCH", body: JSON.stringify({ done: !todo.done }) });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "更新失败");
    }
  };

  const remove = async (id: number) => {
    try {
      await appFetch(`${BASE}?id=${id}`, { method: "DELETE" });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "删除失败");
    }
  };

  const remaining = todos.filter((t) => !t.done).length;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="mx-auto max-w-2xl px-5 py-8 flex flex-col gap-5">
        <header className="flex items-end justify-between gap-3">
          <div>
            <h2 className="m-0 text-2xl font-semibold text-text leading-tight">待办</h2>
            <p className="m-0 text-sm text-text-mute">还剩 {remaining} 项未完成</p>
          </div>
        </header>

        {error ? <p className="inline-error">{error}</p> : null}

        <div className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            className="input flex-1"
            placeholder="添加一项待办,回车确认"
          />
          <button className="btn btn-sm btn-primary" disabled={!text.trim()} onClick={add}>
            <Plus size={14} />
            添加
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          {todos.map((todo) => (
            <div
              key={todo.id}
              className="flex items-center gap-3 p-3 rounded-xl border border-border-soft bg-bg-raised group"
            >
              <button
                className={[
                  "w-5 h-5 rounded-md border grid place-items-center shrink-0 transition-colors",
                  todo.done ? "bg-accent border-accent text-white" : "border-border-soft text-transparent hover:border-accent",
                ].join(" ")}
                onClick={() => toggle(todo)}
              >
                <Check size={13} strokeWidth={3} />
              </button>
              <span className={["flex-1 text-sm", todo.done ? "line-through text-text-faint" : "text-text"].join(" ")}>
                {todo.text}
              </span>
              <button
                className="btn btn-sm btn-ghost !px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                title="删除"
                onClick={() => remove(todo.id)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {todos.length === 0 ? (
            <div className="empty mt-2">
              <div className="text-text-dim font-medium">还没有待办</div>
              <div className="text-xxs text-text-faint">在上方输入框添加</div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
