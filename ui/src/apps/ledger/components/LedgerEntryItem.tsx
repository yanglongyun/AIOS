import { Trash2 } from "lucide-react";
import type { LedgerEntry } from "../types";

const yuan = (amount: number) => `¥${amount.toFixed(2)}`;
const iconButtonClass =
  "inline-flex h-8 items-center justify-center rounded-md border border-transparent px-2 text-slate-500 transition hover:bg-slate-100 hover:text-red-600 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-red-400";

export function LedgerEntryItem({
  entry,
  onRemove,
}: {
  entry: LedgerEntry;
  onRemove: () => void;
}) {
  return (
    <div className="group flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex flex-col min-w-0 flex-1">
        <span className="truncate text-sm text-slate-900 dark:text-neutral-100">
          {entry.category || "未分类"}
          {entry.note ? <span className="text-slate-500 dark:text-neutral-400"> · {entry.note}</span> : null}
        </span>
        <span className="text-[10px] text-slate-400 dark:text-neutral-500">{entry.occurred_on}</span>
      </div>
      <span className={["text-sm font-semibold shrink-0", entry.type === "income" ? "text-emerald-500" : "text-rose-500"].join(" ")}>
        {entry.type === "income" ? "+" : "-"}
        {yuan(entry.amount)}
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
