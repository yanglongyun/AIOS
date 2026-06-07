export function SummaryCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
      <span className="text-[10px] text-slate-400 dark:text-neutral-500">{label}</span>
      <span className={["text-lg font-semibold truncate", tone].join(" ")}>{value}</span>
    </div>
  );
}
