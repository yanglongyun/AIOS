import { useEffect, useState } from "react";
import type { Task } from "../api";
import { api } from "../api";
import type { RouteName } from "../components/AppShell";
import { useConversation } from "../state/conversation";
import { useLayout } from "../state/layout";
import { useTask } from "../state/task";
import { titleFromPrompt } from "../lib/messages";
import { MobileTaskSheet } from "./tasks/MobileTaskSheet";
import { TaskCreate } from "./tasks/TaskCreate";
import { TaskDetail } from "./tasks/TaskDetail";
import { TaskList } from "./tasks/TaskList";

export function TasksView({ setRoute }: { setRoute: (route: RouteName) => void }) {
  const layout = useLayout();
  const taskState = useTask();
  const conversation = useConversation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [errorText, setErrorText] = useState("");
  const [mode, setMode] = useState<"view" | "create">("view");
  const [form, setForm] = useState({ name: "", detail: "" });

  const refresh = async () => {
    setErrorText("");
    try {
      const result = await api.listTasks();
      const list = result.tasks || [];
      setTasks(list);
      if (taskState.currentId) {
        const fresh = list.find((item) => item.id === taskState.currentId);
        if (fresh) taskState.setCurrentTask(fresh.id, fresh);
        else taskState.clearCurrentTask();
      }
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "加载失败");
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const selectTask = (task: Task) => {
    taskState.setCurrentTask(task.id, task);
    setMode("view");
    layout.closeMobileTasksList();
  };

  const startCreate = () => {
    setMode("create");
    setForm({ name: "", detail: "" });
    taskState.clearCurrentTask();
    layout.closeMobileTasksList();
  };

  const submitCreate = async () => {
    const detail = form.detail.trim();
    if (!detail) return;
    const name = form.name.trim() || titleFromPrompt(detail);
    try {
      const result = await api.createTask({ name, detail });
      setForm({ name: "", detail: "" });
      setMode("view");
      await refresh();
      const created = tasks.find((item) => item.id === result.taskId);
      if (created) taskState.setCurrentTask(created.id, created);
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "创建失败");
    }
  };

  const abort = async (id: number) => {
    try {
      await api.abortTask(id);
      await refresh();
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "中止失败");
    }
  };

  const openConversation = (conversationId?: string) => {
    if (!conversationId) return;
    conversation.setCurrentConversation(conversationId, null);
    setRoute("chat");
  };

  return (
    <div className="flex-1 min-h-0 min-w-0 flex relative">
      <TaskList
        tasks={tasks}
        selectedId={taskState.currentId}
        mode={mode}
        refresh={refresh}
        selectTask={selectTask}
        startCreate={startCreate}
      />
      <section className="flex-1 flex flex-col min-h-0 min-w-0">
        {mode === "create" ? (
          <TaskCreate
            form={form}
            setForm={setForm}
            errorText={errorText}
            cancel={() => setMode("view")}
            submit={submitCreate}
          />
        ) : taskState.current ? (
          <TaskDetail
            task={taskState.current}
            errorText={errorText}
            abort={abort}
            openConversation={openConversation}
          />
        ) : (
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
            {errorText ? <p className="inline-error">{errorText}</p> : null}
            <div className="w-14 h-14 rounded-2xl grid place-items-center text-text-faint bg-bg-raised border border-border-soft">✓</div>
            <div className="flex flex-col gap-1">
              <div className="text-text font-medium">选择一个任务查看详情</div>
              <div className="text-xs text-text-mute max-w-[280px]">
                从左侧列表选择，或{" "}
                <button className="text-accent hover:underline" onClick={startCreate}>
                  新建任务
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
      <MobileTaskSheet
        open={layout.mobileTasksListOpen}
        tasks={tasks}
        selectedId={taskState.currentId}
        selectTask={selectTask}
        startCreate={startCreate}
        close={layout.closeMobileTasksList}
      />
    </div>
  );
}
