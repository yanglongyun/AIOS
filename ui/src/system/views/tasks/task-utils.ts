export const statusBadgeClass = (status: string) => {
  const base = "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium";
  if (status === "running" || status === "pending") return `${base} border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300`;
  if (status === "done" || status === "completed" || status === "success") return `${base} border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300`;
  if (status === "aborted" || status === "cancelled") return `${base} border-slate-200 bg-slate-100 text-slate-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400`;
  if (status === "error" || status === "failed") return `${base} border-red-200 bg-red-50 text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400`;
  return `${base} border-slate-200 bg-slate-100 text-slate-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400`;
};

export const previewText = (value: unknown, fallback = "暂无内容") => {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return fallback;
  return text.length > 120 ? `${text.slice(0, 120)}...` : text;
};

export const formatTime = (value: unknown) => {
  if (!value) return "--";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export type TaskResult = { value?: Record<string, unknown>; raw: string; valid: boolean };

export const parseTaskResult = (response: unknown): TaskResult => {
  const raw = String(response || "").trim();
  try {
    const obj = JSON.parse(raw);
    if (obj && typeof obj === "object" && !Array.isArray(obj)) {
      return { value: obj as Record<string, unknown>, raw, valid: true };
    }
  } catch {
  }
  return { raw, valid: false };
};
