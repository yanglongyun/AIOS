import { useEffect, useRef, useState } from "react";
import { DetailView } from "./DetailView";
import { ListView } from "./ListView";
import type { Task } from "./types";

const PENDING = new Set(["pending", "running"]);

const listTasks = async () => {
  const response = await fetch("/api/tasks");
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `${response.status} ${response.statusText}`);
  return (data.tasks || []) as Task[];
};

const getTask = async (id: number | string) => {
  const response = await fetch(`/api/tasks?id=${encodeURIComponent(String(id))}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `${response.status} ${response.statusText}`);
  return data.task as Task;
};

export function TaskView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selected, setSelected] = useState<Task | null>(null);
  const [errorText, setErrorText] = useState("");

  const refresh = async () => {
    setErrorText("");
    try {
      const list = await listTasks();
      setTasks(list);
      if (selected) {
        const fresh = list.find((task) => task.id === selected.id);
        if (fresh) setSelected(fresh);
      }
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "加载失败");
    }
  };

  // 始终调用最新的 refresh,避免轮询闭包读到旧的 selected
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  // 自动刷新:有进行中的任务时 2.5s 轮询,否则 8s 刷新;页面隐藏时暂停。
  const hasPending = tasks.some((task) => PENDING.has(task.status));
  useEffect(() => {
    refreshRef.current();
    let timer = 0;
    const tick = () => {
      if (document.visibilityState === "visible") refreshRef.current();
      timer = window.setTimeout(tick, hasPending ? 2500 : 8000);
    };
    timer = window.setTimeout(tick, hasPending ? 2500 : 8000);
    return () => window.clearTimeout(timer);
  }, [hasPending]);

  return (
    <div className="flex-1 min-h-0 min-w-0 flex">
      <ListView
        tasks={tasks}
        selectedId={selected?.id || null}
        onSelect={setSelected}
        errorText={errorText}
        refresh={refresh}
      />
      {selected ? (
        <DetailView
          task={selected}
          refresh={async () => {
            const task = await getTask(selected.id);
            setSelected(task);
            setTasks((items) =>
              items.map((item) => (item.id === task.id ? task : item)),
            );
          }}
          close={() => setSelected(null)}
        />
      ) : null}
    </div>
  );
}
