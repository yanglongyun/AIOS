import { useEffect, useRef, useState } from "react";
import { runDecomposeTask } from "../task";
import { TodoComposer } from "../components/TodoComposer";
import { TodoItem } from "../components/TodoItem";
import { createTodo, deleteTodo, listTodos, updateTodoDone } from "../requests";
import type { Todo } from "../types";

const errorClass = "m-0 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400";
const emptyClass =
  "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 bg-white px-5 py-10 text-center text-slate-500 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-400";

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [taskHint, setTaskHint] = useState("");
  const [decomposing, setDecomposing] = useState(false);
  const runRef = useRef<{ cancel: () => void } | null>(null);

  const refresh = async () => {
    try {
      setTodos(await listTodos());
    } catch (error) {
      setError(error instanceof Error ? error.message : "加载失败");
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => () => runRef.current?.cancel(), []);

  const add = async () => {
    const value = text.trim();
    if (!value) return;
    try {
      await createTodo(value);
      setText("");
      await refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "添加失败");
    }
  };

  const toggle = async (todo: Todo) => {
    try {
      await updateTodoDone(todo.id, !todo.done);
      await refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "更新失败");
    }
  };

  const remove = async (id: number) => {
    try {
      await deleteTodo(id);
      await refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "删除失败");
    }
  };

  const decompose = () => {
    const value = text.trim();
    if (!value || decomposing) return;
    setDecomposing(true);
    setError("");
    setTaskHint("正在拆解…");
    runRef.current = runDecomposeTask(value, {
      onStart: () => setText(""),
      onDone: async () => {
        setTaskHint("已根据拆解结果添加待办");
        await refresh();
      },
      onError: (message) => setError(message),
      onSettled: () => {
        setDecomposing(false);
        runRef.current = null;
      },
    });
  };

  const cancelDecompose = () => {
    runRef.current?.cancel();
    runRef.current = null;
    setDecomposing(false);
    setTaskHint("");
  };

  const remaining = todos.filter((todo) => !todo.done).length;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="mx-auto max-w-2xl px-5 py-8 flex flex-col gap-5">
        <header className="flex items-end justify-between gap-3">
          <div>
            <h2 className="m-0 text-2xl font-semibold leading-tight text-slate-950 dark:text-neutral-100">待办</h2>
            <p className="m-0 text-sm text-slate-500 dark:text-neutral-400">还剩 {remaining} 项未完成</p>
          </div>
        </header>

        {error ? <p className={errorClass}>{error}</p> : null}
        {taskHint ? (
          <p className={["m-0 text-xs", decomposing ? "animate-pulse text-amber-600 dark:text-amber-400" : "text-slate-500 dark:text-neutral-400"].join(" ")}>{taskHint}</p>
        ) : null}

        <TodoComposer
          text={text}
          setText={setText}
          decomposing={decomposing}
          onAdd={add}
          onDecompose={decompose}
          onCancelDecompose={cancelDecompose}
        />

        <div className="flex flex-col gap-1.5">
          {todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={() => toggle(todo)}
              onRemove={() => remove(todo.id)}
            />
          ))}
          {todos.length === 0 ? (
            <div className={`${emptyClass} mt-2`}>
              <div className="font-medium text-slate-600 dark:text-neutral-300">还没有待办</div>
              <div className="text-[10px] text-slate-400 dark:text-neutral-500">在上方输入框添加</div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
