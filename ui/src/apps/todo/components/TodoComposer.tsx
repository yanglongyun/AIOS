import { Plus, Sparkles, X } from "lucide-react";

const inputClass =
  "h-9 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500";
const ghostButtonClass =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-transparent px-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100";
const primaryButtonClass =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-slate-900 bg-slate-900 px-2.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950 dark:hover:bg-neutral-200";

export function TodoComposer({
  text,
  setText,
  decomposing,
  onAdd,
  onDecompose,
  onCancelDecompose,
}: {
  text: string;
  setText: (value: string) => void;
  decomposing: boolean;
  onAdd: () => void;
  onDecompose: () => void;
  onCancelDecompose: () => void;
}) {
  const hasText = !!text.trim();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") onAdd();
        }}
        className={inputClass}
        placeholder="添加一项待办,回车确认"
      />
      <button className={primaryButtonClass} disabled={!hasText} onClick={onAdd}>
        <Plus size={14} />
        添加
      </button>
      {decomposing ? (
        <button className={ghostButtonClass} onClick={onCancelDecompose} title="取消">
          <X size={14} />
          取消
        </button>
      ) : (
        <button className={ghostButtonClass} disabled={!hasText} onClick={onDecompose}>
          <Sparkles size={14} />
          智能分解
        </button>
      )}
    </div>
  );
}
