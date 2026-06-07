import { Plus, Sparkles, X } from "lucide-react";
import type { LedgerFormState } from "../types";

const inputClass =
  "h-9 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500";
const ghostButtonClass =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-transparent px-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100";
const primaryButtonClass =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-slate-900 bg-slate-900 px-2.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950 dark:hover:bg-neutral-200";

export function LedgerComposer({
  form,
  setForm,
  smartInput,
  setSmartInput,
  smartBusy,
  onAdd,
  onSmartAdd,
  onCancelSmart,
}: {
  form: LedgerFormState;
  setForm: (value: LedgerFormState) => void;
  smartInput: string;
  setSmartInput: (value: string) => void;
  smartBusy: boolean;
  onAdd: () => void;
  onSmartAdd: () => void;
  onCancelSmart: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={smartInput}
          onChange={(event) => setSmartInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onSmartAdd();
          }}
          className={`${inputClass} min-w-0 flex-1`}
          placeholder="智能输入: 例如 今天午饭 35, 打车 18, 工资 12000"
        />
        {smartBusy ? (
          <button className={ghostButtonClass} onClick={onCancelSmart} title="取消">
            <X size={14} />
            取消
          </button>
        ) : (
          <button className={ghostButtonClass} disabled={!smartInput.trim()} onClick={onSmartAdd}>
            <Sparkles size={14} />
            智能输入
          </button>
        )}
      </div>
      <div className="flex w-fit gap-1 rounded-lg bg-slate-100 p-1 dark:bg-neutral-950">
        {(["expense", "income"] as const).map((type) => (
          <button
            key={type}
            className={[
              "rounded-md px-3 py-1 text-sm font-medium transition-colors",
              form.type === type ? "bg-white text-slate-950 shadow-sm dark:bg-neutral-900 dark:text-neutral-100" : "text-slate-500 dark:text-neutral-400",
            ].join(" ")}
            onClick={() => setForm({ ...form, type })}
          >
            {type === "expense" ? "支出" : "收入"}
          </button>
        ))}
      </div>
      <div className="flex gap-2 flex-wrap">
        <input
          value={form.amount}
          onChange={(event) => setForm({ ...form, amount: event.target.value })}
          className={`${inputClass} w-28`}
          type="number"
          placeholder="金额"
        />
        <input
          value={form.category}
          onChange={(event) => setForm({ ...form, category: event.target.value })}
          className={`${inputClass} w-28`}
          placeholder="分类"
        />
        <input
          value={form.note}
          onChange={(event) => setForm({ ...form, note: event.target.value })}
          onKeyDown={(event) => {
            if (event.key === "Enter") onAdd();
          }}
          className={`${inputClass} min-w-[120px] flex-1`}
          placeholder="备注"
        />
        <button className={primaryButtonClass} onClick={onAdd}>
          <Plus size={14} />
          记一笔
        </button>
      </div>
    </div>
  );
}
