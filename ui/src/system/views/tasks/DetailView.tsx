import type { ReactNode } from "react";
import { formatTime, parseTaskResult, statusBadgeClass } from "./task-utils";
import type { Task } from "./types";

const ghostButtonClass =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-transparent px-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100";

export function DetailView({
  task,
  refresh,
  close,
}: {
  task: Task;
  refresh: () => Promise<void>;
  close: () => void;
}) {
  return (
    <>
      <div className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={close} />
      <aside className="fixed inset-y-0 right-0 z-50 flex min-h-0 w-[420px] max-w-[92vw] shrink-0 flex-col border-l border-slate-200 bg-slate-50 shadow-2xl md:static md:z-auto md:shadow-none dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 px-4 dark:border-neutral-800">
          <button className={ghostButtonClass} onClick={close}>关闭</button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-slate-950 dark:text-neutral-100">任务 #{task.id}</div>
            <div className="truncate text-[10px] text-slate-400 dark:text-neutral-500">{task.name || "未命名"}</div>
          </div>
          <button className={ghostButtonClass} onClick={() => refresh()}>刷新</button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={statusBadgeClass(task.status)}>{task.status}</span>
            <span className="text-xs text-slate-400 dark:text-neutral-500">创建 {formatTime(task.created_at)}</span>
            {task.finished_at ? <span className="text-xs text-slate-400 dark:text-neutral-500">完成 {formatTime(task.finished_at)}</span> : null}
          </div>

          <DetailBlock title="会话">
            <div className="break-all font-mono text-xs text-slate-500 dark:text-neutral-400">{task.chat_id || "--"}</div>
          </DetailBlock>

          <DetailBlock title="输入">
            <pre className="m-0 whitespace-pre-wrap break-words font-sans text-xs leading-relaxed text-slate-500 dark:text-neutral-400">{task.prompt || task.detail || "暂无内容"}</pre>
          </DetailBlock>

          {task.response ? <TaskResultBlock response={task.response} /> : null}

          {task.error ? (
            <DetailBlock title="错误">
              <pre className="m-0 whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-red-600 dark:text-red-400">{task.error}</pre>
            </DetailBlock>
          ) : null}
        </div>
      </aside>
    </>
  );
}

function DetailBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-neutral-500">{title}</div>
      <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">{children}</div>
    </section>
  );
}

function TaskResultBlock({ response }: { response: string }) {
  const { value, raw, valid } = parseTaskResult(response);
  return (
    <DetailBlock title="结果">
      <div className="flex flex-col gap-3">
        {valid && value ? (
          <div className="overflow-x-auto rounded-md border border-slate-200 bg-slate-100 p-2.5 dark:border-neutral-800 dark:bg-neutral-950">
            <JsonValue value={value} />
          </div>
        ) : null}
        {!valid ? (
          <pre className="m-0 whitespace-pre-wrap break-words font-mono text-xs text-slate-500 dark:text-neutral-400">{raw}</pre>
        ) : null}
      </div>
    </DetailBlock>
  );
}

function JsonValue({ value }: { value: any }) {
  if (value === null) return <span className="text-slate-400 dark:text-neutral-500">null</span>;
  if (typeof value === "boolean") return <span className="text-amber-600 dark:text-amber-400">{String(value)}</span>;
  if (typeof value === "number") return <span className="text-emerald-500 font-mono">{value}</span>;
  if (typeof value === "string") return <span className="whitespace-pre-wrap break-words text-slate-900 dark:text-neutral-100">{value}</span>;

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-slate-400 dark:text-neutral-500">[]</span>;
    return (
      <ul className="m-0 list-none flex flex-col gap-1 pl-0">
        {value.map((item, i) => (
          <li key={i} className="flex gap-2 text-xs">
            <span className="shrink-0 font-mono text-slate-400 dark:text-neutral-500">{i}</span>
            <div className="min-w-0 flex-1"><JsonValue value={item} /></div>
          </li>
        ))}
      </ul>
    );
  }

  const entries = Object.entries(value);
  if (entries.length === 0) return <span className="text-slate-400 dark:text-neutral-500">{"{}"}</span>;
  return (
    <div className="flex flex-col gap-1">
      {entries.map(([key, val]) => (
        <div key={key} className="flex gap-2 text-xs">
          <span className="shrink-0 font-medium text-slate-500 dark:text-neutral-400">{key}</span>
          <div className="min-w-0 flex-1"><JsonValue value={val} /></div>
        </div>
      ))}
    </div>
  );
}
