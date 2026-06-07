import { RefreshCw } from "lucide-react";
import { formatTime, parseTaskResult, previewText, statusBadgeClass } from "./task-utils";
import type { Task } from "./types";

const iconButtonClass =
  "inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100";
const errorClass = "m-0 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400";
const emptyClass =
  "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 bg-white px-5 py-10 text-center text-slate-500 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-400";

export function ListView({
  tasks,
  selectedId,
  onSelect,
  errorText,
  refresh,
}: {
  tasks: Task[];
  selectedId: number | null;
  onSelect: (task: Task) => void;
  errorText: string;
  refresh: () => void;
}) {
  return (
    <section className="flex-1 min-h-0 overflow-y-auto">
      <div className="mx-auto max-w-4xl px-5 py-5 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <strong className="text-sm font-semibold text-slate-950 dark:text-neutral-100">任务</strong>
          <button className={iconButtonClass} title="刷新" onClick={refresh}>
            <RefreshCw size={14} />
          </button>
        </div>
        {errorText ? <p className={errorClass}>{errorText}</p> : null}
        <div className="flex flex-col gap-1">
          {tasks.map((task) => (
            <button
              key={task.id}
              className={[
                "flex flex-col gap-1.5 p-3 rounded-lg border text-left transition-colors",
                selectedId === task.id
                  ? "border-amber-500 bg-amber-50 dark:bg-amber-950/20"
                  : "border-slate-200 bg-white hover:bg-slate-100 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800",
              ].join(" ")}
              onClick={() => onSelect(task)}
            >
              <div className="flex items-start justify-between gap-2 w-full">
                <div className="min-w-0 flex-1 truncate text-sm font-medium text-slate-950 dark:text-neutral-100">
                  <span className="mr-1 font-mono text-[10px] text-slate-400 dark:text-neutral-500">#{task.id}</span>
                  {task.name || "未命名"}
                </div>
                <span className={`${statusBadgeClass(task.status)} shrink-0 px-1.5 py-0`}>{task.status}</span>
              </div>
              <div className="w-full truncate text-xs text-slate-500 dark:text-neutral-400">{previewText(task.prompt, "暂无内容")}</div>
              <div className="mt-0.5 flex w-full items-center justify-between gap-1.5 text-[10px] text-slate-400 dark:text-neutral-500">
                <span>会话 #{task.chat_id}</span>
                <span>{formatTime(task.created_at)}</span>
              </div>
              {task.response ? <div className="line-clamp-2 text-xs text-slate-600 dark:text-neutral-300">{previewText(JSON.stringify(parseTaskResult(task.response).value || task.response))}</div> : null}
              {task.error ? <div className="line-clamp-2 text-xs text-red-600 dark:text-red-400">{previewText(task.error)}</div> : null}
            </button>
          ))}
          {tasks.length === 0 ? (
            <div className={`${emptyClass} mx-1 mt-2`}>
              <div className="font-medium text-slate-600 dark:text-neutral-300">暂无任务</div>
              <div className="text-[10px] text-slate-400 dark:text-neutral-500">系统任务会在这里出现</div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
