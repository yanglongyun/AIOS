import { Plus } from "lucide-react";
import type { Task } from "../../api";
import { previewText } from "../../lib/messages";
import { statusBadgeClass } from "./task-utils";

export function MobileTaskSheet({
  open,
  tasks,
  selectedId,
  selectTask,
  startCreate,
  close,
}: {
  open: boolean;
  tasks: Task[];
  selectedId: number | null;
  selectTask: (task: Task) => void;
  startCreate: () => void;
  close: () => void;
}) {
  if (!open) return null;

  return (
    <div className="md:hidden fixed inset-0 z-50 flex flex-col">
      <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={close} />
      <div className="bg-bg-raised rounded-t-3xl flex flex-col max-h-[85vh] min-h-[60vh] shadow-[0_-12px_40px_rgba(0,0,0,0.5)]">
        <div className="flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-border-strong" />
        </div>
        <div className="flex flex-col gap-2.5 p-3 shrink-0">
          <button className="flex items-center justify-center gap-2 w-full h-10 rounded-xl border border-border-soft bg-bg text-text text-sm font-semibold" onClick={startCreate}>
            <Plus size={14} strokeWidth={2.2} />
            新建任务
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-2 flex flex-col gap-0.5">
          {tasks.map((task) => (
            <button key={task.id} className={["conv-item", task.id === selectedId ? "active" : ""].join(" ")} onClick={() => selectTask(task)}>
              <div className="flex items-start justify-between gap-2 w-full">
                <div className="flex-1 min-w-0 text-sm font-medium truncate">
                  <span className="font-mono text-xxs text-text-faint mr-1">#{task.id}</span>
                  {task.name || "未命名"}
                </div>
                <span className={["badge shrink-0 !text-[10px] !py-0 !px-1.5", statusBadgeClass(task.status)].join(" ")}>{task.status}</span>
              </div>
              <div className="text-xs text-text-mute truncate w-full">{previewText(task.prompt, "暂无内容")}</div>
            </button>
          ))}
          {tasks.length === 0 ? (
            <div className="empty mx-1">
              <div className="text-text-dim font-medium">暂无任务</div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
