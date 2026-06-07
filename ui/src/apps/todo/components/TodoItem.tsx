import { Check, Trash2 } from "lucide-react";
import type { Todo } from "../types";

const iconButtonClass =
  "inline-flex h-8 items-center justify-center rounded-md border border-transparent px-2 text-slate-500 transition hover:bg-slate-100 hover:text-red-600 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-red-400";

export function TodoItem({
  todo,
  onToggle,
  onRemove,
}: {
  todo: Todo;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="group flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
      <button
        className={[
          "grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors",
          todo.done ? "border-amber-500 bg-amber-500 text-white" : "border-slate-300 text-transparent hover:border-amber-500 dark:border-neutral-700 dark:hover:border-amber-400",
        ].join(" ")}
        onClick={onToggle}
      >
        <Check size={13} strokeWidth={3} />
      </button>
      <span className={["flex-1 text-sm", todo.done ? "text-slate-400 line-through dark:text-neutral-500" : "text-slate-900 dark:text-neutral-100"].join(" ")}>
        {todo.text}
      </span>
      <button
        className={`${iconButtonClass} opacity-0 group-hover:opacity-100`}
        title="删除"
        onClick={onRemove}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
