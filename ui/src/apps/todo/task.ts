type TaskState = { status: string; response?: string; error?: string };
type TaskStart = { taskId: number; chatId: string };
type DecomposeResult = { created: string[]; raw: string };

const TERMINAL = new Set(["done", "error", "aborted"]);

const readJson = async <T,>(response: Response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) throw new Error(data.error || `${response.status} ${response.statusText}`);
  return data as T;
};

const startTask = async (name: string, detail: string) =>
  readJson<TaskStart>(await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, detail }),
  }));

const getTask = async (id: number) => {
  const data = await readJson<{ task: TaskState }>(
    await fetch(`/api/tasks?id=${encodeURIComponent(String(id))}`),
  );
  return data.task;
};

const parseDecomposeResult = (response: unknown): DecomposeResult => {
  const raw = String(response || "").trim();
  const parsed = JSON.parse(raw) as Omit<DecomposeResult, "raw">;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("任务结果不是 JSON 对象");
  return { ...parsed, raw };
};

export function runDecomposeTask(
  text: string,
  hooks: {
    onStart?: () => void;
    onDone?: (result: DecomposeResult) => void | Promise<void>;
    onError?: (message: string) => void;
    onSettled?: () => void;
  },
): { cancel: () => void } {
  const detail = [
    "你是 AIOS 的系统智能任务。请把用户输入的待办拆解成 3-7 条具体、可执行、粒度清晰的子待办。",
    "拆解后,用 shell 逐条调用本机待办应用接口创建待办(后端地址见系统环境段):",
    "POST /apps/todo/todos,body 为 JSON: {\"text\":\"子待办内容\"}",
    "不要创建泛泛的标题项,只创建可以直接执行的动作项。",
    "最终返回 JSON 对象,结构必须是: {\"created\":[\"已创建的子待办内容\"]}。",
    "",
    text,
  ].join("\n");
  let cancelled = false;
  let timer: number | undefined;

  (async () => {
    try {
      const started = await startTask("todo.decompose", detail);
      if (cancelled) return;
      hooks.onStart?.();
      const deadline = Date.now() + 120_000;
      while (!cancelled) {
        await new Promise<void>((resolve) => {
          timer = window.setTimeout(resolve, 1200);
        });
        if (cancelled) return;
        const task = await getTask(started.taskId);
        if (task.status === "done") {
          await hooks.onDone?.(parseDecomposeResult(task.response));
          return;
        }
        if (TERMINAL.has(task.status)) throw new Error(task.error || `任务 ${task.status}`);
        if (Date.now() > deadline) throw new Error("任务仍在运行,可到「任务」页查看结果");
      }
    } catch (error) {
      if (!cancelled) hooks.onError?.(error instanceof Error ? error.message : "任务执行失败");
    } finally {
      if (!cancelled) hooks.onSettled?.();
    }
  })();

  return {
    cancel: () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    },
  };
}
