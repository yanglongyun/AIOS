import { Plus, RefreshCw } from "lucide-react";
import type { Task } from "../../api";
import { formatTime, previewText } from "../../lib/messages";
import { useLayout } from "../../state/layout";
import { statusBadgeClass } from "./task-utils";

export function TaskList({
  tasks,
  selectedId,
  mode,
  refresh,
  selectTask,
  startCreate,
}: {
  tasks: Task[];
  selectedId: number | null;
  mode: "view" | "create";
  refresh: () => void;
  selectTask: (task: Task) => void;
  startCreate: () => void;
}) {
  const layout = useLayout();

  return (
    <aside
      className={["hidden md:flex flex-col min-h-0 overflow-hidden transition-[width] duration-300 ease-out shrink-0", layout.tasksListCollapsed ? "md:w-0" : "md:w-[280px]"].join(" ")}
      style={{ background: "linear-gradient(to right, var(--nav-from), var(--nav-to)), var(--color-bg)" }}
    >
      <div className="w-[280px] flex flex-col min-h-0 flex-1">
        <div className="flex items-center justify-between gap-2 p-3">
          <strong className="text-sm font-semibold text-text">任务</strong>
          <button className="btn btn-sm btn-ghost !px-2 !h-8 !w-8" title="刷新" onClick={refresh}>
            <RefreshCw size={14} />
          </button>
        </div>
        <div className="px-3 pb-2 shrink-0">
          <button
            className="flex items-center justify-center gap-2 w-full h-10 rounded-xl border border-border-soft bg-bg-raised text-text text-sm font-semibold hover:bg-bg-hover transition-colors shadow-sm"
            onClick={startCreate}
          >
            <Plus size={14} strokeWidth={2.2} />
            新建任务
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-3 flex flex-col gap-0.5">
          {tasks.map((task) => (
            <button
              key={task.id}
              className={["conv-item !py-2.5", task.id === selectedId && mode === "view" ? "active" : ""].join(" ")}
              onClick={() => selectTask(task)}
            >
              <div className="flex items-start justify-between gap-2 w-full">
                <div className="flex-1 min-w-0 text-sm font-medium truncate">
                  <span className="font-mono text-xxs text-text-faint mr-1">#{task.id}</span>
                  {task.name || "未命名"}
                </div>
                <span className={["badge shrink-0 !text-[10px] !py-0 !px-1.5", statusBadgeClass(task.status)].join(" ")}>{task.status}</span>
              </div>
              <div className="text-xs text-text-mute truncate w-full">{previewText(task.prompt, "暂无内容")}</div>
              <div className="flex justify-between items-center gap-1.5 text-xxs text-text-faint mt-0.5 w-full">
                <span>会话 #{task.conversation_id}</span>
                <span>{formatTime(task.created_at)}</span>
              </div>
            </button>
          ))}
          {tasks.length === 0 ? (
            <div className="empty mx-1 mt-2">
              <div className="text-text-dim font-medium">暂无任务</div>
              <div className="text-xxs text-text-faint">点击上方「新建任务」</div>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
