import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { appFetch } from "../lib";

type Entry = {
  id: number;
  type: "income" | "expense";
  amount: number;
  category: string;
  note: string;
  occurred_on: string;
};
type Summary = { income: number; expense: number; balance: number };

const BASE = "/apps/ledger/entries";
const yuan = (n: number) => `¥${n.toFixed(2)}`;

export default function LedgerApp() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [summary, setSummary] = useState<Summary>({ income: 0, expense: 0, balance: 0 });
  const [form, setForm] = useState({ type: "expense" as "income" | "expense", amount: "", category: "", note: "" });
  const [error, setError] = useState("");

  const refresh = async () => {
    try {
      const data = await appFetch<{ entries: Entry[]; summary: Summary }>(BASE);
      setEntries(data.entries);
      setSummary(data.summary);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const add = async () => {
    const amount = Number(form.amount);
    if (!amount || amount <= 0) {
      setError("请输入有效金额");
      return;
    }
    try {
      await appFetch(BASE, {
        method: "POST",
        body: JSON.stringify({ type: form.type, amount, category: form.category.trim(), note: form.note.trim() }),
      });
      setForm({ type: form.type, amount: "", category: "", note: "" });
      setError("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "记账失败");
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

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="mx-auto max-w-2xl px-5 py-8 flex flex-col gap-5">
        <h2 className="m-0 text-2xl font-semibold text-text leading-tight">记账本</h2>

        {/* 汇总 */}
        <div className="grid grid-cols-3 gap-3">
          <SummaryCard label="收入" value={yuan(summary.income)} tone="text-emerald-500" />
          <SummaryCard label="支出" value={yuan(summary.expense)} tone="text-rose-500" />
          <SummaryCard label="结余" value={yuan(summary.balance)} tone={summary.balance >= 0 ? "text-text" : "text-rose-500"} />
        </div>

        {error ? <p className="inline-error">{error}</p> : null}

        {/* 记一笔 */}
        <div className="flex flex-col gap-3 p-4 rounded-2xl border border-border-soft bg-bg-raised">
          <div className="flex gap-1 p-1 rounded-xl bg-bg-hover w-fit">
            {(["expense", "income"] as const).map((t) => (
              <button
                key={t}
                className={[
                  "px-3 py-1 rounded-lg text-sm font-medium transition-colors",
                  form.type === t ? "bg-bg-raised text-text shadow-sm" : "text-text-mute",
                ].join(" ")}
                onClick={() => setForm({ ...form, type: t })}
              >
                {t === "expense" ? "支出" : "收入"}
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            <input
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="input w-28"
              type="number"
              placeholder="金额"
            />
            <input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="input w-28"
              placeholder="分类"
            />
            <input
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && add()}
              className="input flex-1 min-w-[120px]"
              placeholder="备注"
            />
            <button className="btn btn-sm btn-primary" onClick={add}>
              <Plus size={14} />
              记一笔
            </button>
          </div>
        </div>

        {/* 流水 */}
        <div className="flex flex-col gap-1.5">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-3 p-3 rounded-xl border border-border-soft bg-bg-raised group"
            >
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm text-text truncate">
                  {entry.category || "未分类"}
                  {entry.note ? <span className="text-text-mute"> · {entry.note}</span> : null}
                </span>
                <span className="text-xxs text-text-faint">{entry.occurred_on}</span>
              </div>
              <span className={["text-sm font-semibold shrink-0", entry.type === "income" ? "text-emerald-500" : "text-rose-500"].join(" ")}>
                {entry.type === "income" ? "+" : "-"}
                {yuan(entry.amount)}
              </span>
              <button
                className="btn btn-sm btn-ghost !px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                title="删除"
                onClick={() => remove(entry.id)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {entries.length === 0 ? (
            <div className="empty mt-2">
              <div className="text-text-dim font-medium">还没有账目</div>
              <div className="text-xxs text-text-faint">上方记第一笔</div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="flex flex-col gap-1 p-3 rounded-2xl border border-border-soft bg-bg-raised">
      <span className="text-xxs text-text-faint">{label}</span>
      <span className={["text-lg font-semibold truncate", tone].join(" ")}>{value}</span>
    </div>
  );
}
