import type { Task } from "../../api";
import { formatTime } from "../../lib/messages";
import { statusBadgeClass } from "./task-utils";

export function TaskDetail({
  task,
  errorText,
  abort,
  openConversation,
}: {
  task: Task;
  errorText: string;
  abort: (id: number) => void;
  openConversation: (id?: string) => void;
}) {
  const running = task.status === "pending" || task.status === "running";

  return (
    <>
      <div className="hidden md:flex items-center justify-between gap-3 py-3 px-5 shrink-0">
        <strong className="text-sm font-semibold text-text truncate">
          <span className="font-mono text-xxs text-text-faint mr-1">#{task.id}</span>
          {task.name || "未命名任务"}
        </strong>
        <div className="flex items-center gap-2">
          <span className={["badge", statusBadgeClass(task.status)].join(" ")}>{task.status}</span>
          {running ? <button className="btn btn-sm btn-danger" onClick={() => abort(task.id)}>中止</button> : null}
          <button className="btn btn-sm btn-ghost" onClick={() => openConversation(task.conversation_id)}>查看会话</button>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-5 py-6 flex flex-col gap-5">
          {errorText ? <p className="inline-error">{errorText}</p> : null}
          <Block title="Prompt">{task.prompt || "(空)"}</Block>
          {task.response ? <Block title="Response">{task.response}</Block> : null}
          {task.error ? <Block title="Error" danger>{task.error}</Block> : null}
          <section className="flex flex-col gap-2">
            <h3 className="text-xxs font-semibold text-text-mute uppercase tracking-wider">元数据</h3>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs text-text-dim p-4 rounded-2xl border border-border-soft bg-bg-raised">
              <dt className="text-text-mute">任务 ID</dt>
              <dd className="font-mono">#{task.id}</dd>
              <dt className="text-text-mute">会话 ID</dt>
              <dd className="font-mono">
                <button className="text-accent hover:underline" onClick={() => openConversation(task.conversation_id)}>#{task.conversation_id}</button>
              </dd>
              <dt className="text-text-mute">状态</dt>
              <dd>{task.status}</dd>
              <dt className="text-text-mute">创建</dt>
              <dd>{formatTime(task.created_at)}</dd>
              {task.finished_at ? <dt className="text-text-mute">完成</dt> : null}
              {task.finished_at ? <dd>{formatTime(task.finished_at)}</dd> : null}
            </dl>
          </section>
        </div>
      </div>
    </>
  );
}

function Block({ title, children, danger = false }: { title: string; children: string; danger?: boolean }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className={["text-xxs font-semibold uppercase tracking-wider", danger ? "text-danger" : "text-text-mute"].join(" ")}>{title}</h3>
      <pre className={["m-0 p-4 rounded-2xl text-smd leading-relaxed whitespace-pre-wrap break-words", danger ? "font-mono text-xs text-danger bg-bg-raised border border-danger/25" : "bg-bg-raised border border-border-soft"].join(" ")} style={{ fontFamily: danger ? "var(--font-mono)" : "var(--font-sans)" }}>{children}</pre>
    </section>
  );
}
