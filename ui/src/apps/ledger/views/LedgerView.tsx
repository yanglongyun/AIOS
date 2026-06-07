import { useEffect, useRef, useState } from "react";
import { runSmartInputTask } from "../task";
import { LedgerComposer } from "../components/LedgerComposer";
import { LedgerEntryItem } from "../components/LedgerEntryItem";
import { SummaryCard } from "../components/SummaryCard";
import { createLedgerEntry, deleteLedgerEntry, listLedgerEntries } from "../requests";
import type { LedgerEntry, LedgerFormState, LedgerSummary } from "../types";

const yuan = (amount: number) => `¥${amount.toFixed(2)}`;
const errorClass = "m-0 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400";
const emptyClass =
  "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 bg-white px-5 py-10 text-center text-slate-500 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-400";

export default function LedgerApp() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [summary, setSummary] = useState<LedgerSummary>({ income: 0, expense: 0, balance: 0 });
  const [form, setForm] = useState<LedgerFormState>({ type: "expense", amount: "", category: "", note: "" });
  const [smartInput, setSmartInput] = useState("");
  const [error, setError] = useState("");
  const [taskHint, setTaskHint] = useState("");
  const [smartBusy, setSmartBusy] = useState(false);
  const runRef = useRef<{ cancel: () => void } | null>(null);

  const refresh = async () => {
    try {
      const data = await listLedgerEntries();
      setEntries(data.entries);
      setSummary(data.summary);
    } catch (error) {
      setError(error instanceof Error ? error.message : "加载失败");
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => () => runRef.current?.cancel(), []);

  const add = async () => {
    const amount = Number(form.amount);
    if (!amount || amount <= 0) {
      setError("请输入有效金额");
      return;
    }
    try {
      await createLedgerEntry({
        type: form.type,
        amount,
        category: form.category.trim(),
        note: form.note.trim(),
      });
      setForm({ type: form.type, amount: "", category: "", note: "" });
      setError("");
      await refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "记账失败");
    }
  };

  const remove = async (id: number) => {
    try {
      await deleteLedgerEntry(id);
      await refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "删除失败");
    }
  };

  const smartAdd = () => {
    const value = smartInput.trim();
    if (!value || smartBusy) return;
    setSmartBusy(true);
    setError("");
    setTaskHint("正在识别…");
    runRef.current = runSmartInputTask(value, {
      onStart: () => setSmartInput(""),
      onDone: async () => {
        setTaskHint("已根据识别结果记账");
        await refresh();
      },
      onError: (message) => setError(message),
      onSettled: () => {
        setSmartBusy(false);
        runRef.current = null;
      },
    });
  };

  const cancelSmart = () => {
    runRef.current?.cancel();
    runRef.current = null;
    setSmartBusy(false);
    setTaskHint("");
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="mx-auto max-w-2xl px-5 py-8 flex flex-col gap-5">
        <h2 className="m-0 text-2xl font-semibold leading-tight text-slate-950 dark:text-neutral-100">记账本</h2>

        <div className="grid grid-cols-3 gap-3">
          <SummaryCard label="收入" value={yuan(summary.income)} tone="text-emerald-500" />
          <SummaryCard label="支出" value={yuan(summary.expense)} tone="text-rose-500" />
          <SummaryCard label="结余" value={yuan(summary.balance)} tone={summary.balance >= 0 ? "text-slate-950 dark:text-neutral-100" : "text-rose-500"} />
        </div>

        {error ? <p className={errorClass}>{error}</p> : null}
        {taskHint ? (
          <p className={["m-0 text-xs", smartBusy ? "animate-pulse text-amber-600 dark:text-amber-400" : "text-slate-500 dark:text-neutral-400"].join(" ")}>{taskHint}</p>
        ) : null}

        <LedgerComposer
          form={form}
          setForm={setForm}
          smartInput={smartInput}
          setSmartInput={setSmartInput}
          smartBusy={smartBusy}
          onAdd={add}
          onSmartAdd={smartAdd}
          onCancelSmart={cancelSmart}
        />

        <div className="flex flex-col gap-1.5">
          {entries.map((entry) => (
            <LedgerEntryItem key={entry.id} entry={entry} onRemove={() => remove(entry.id)} />
          ))}
          {entries.length === 0 ? (
            <div className={`${emptyClass} mt-2`}>
              <div className="font-medium text-slate-600 dark:text-neutral-300">还没有账目</div>
              <div className="text-[10px] text-slate-400 dark:text-neutral-500">上方记第一笔</div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
