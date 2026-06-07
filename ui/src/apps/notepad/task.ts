type TaskState = { status: string; response?: string; error?: string };
type TaskStart = { taskId: number; chatId: string };
type PolishResult = { text?: string; raw: string };

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

const parsePolishResult = (response: unknown): PolishResult => {
  const raw = String(response || "").trim();
  const parsed = JSON.parse(raw) as Omit<PolishResult, "raw">;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("任务结果不是 JSON 对象");
  return { ...parsed, raw };
};

export function runPolishTask(
  content: string,
  hooks: {
    onDone?: (result: PolishResult) => void;
    onError?: (message: string) => void;
    onSettled?: () => void;
  },
): { cancel: () => void } {
  const detail = [
    "你是 AIOS 的系统智能任务。请润色下面这条记事本内容,保持原意,让表达更清晰、自然、可读。",
    "不要保存笔记,不要调用任何应用接口,不要解释润色过程。",
    "最终返回 JSON 对象,结构必须是: {\"text\":\"润色后的正文\"}。",
    "",
    content,
  ].join("\n");
  let cancelled = false;
  let timer: number | undefined;

  (async () => {
    try {
      const started = await startTask("notepad.polish", detail);
      const deadline = Date.now() + 120_000;
      while (!cancelled) {
        await new Promise<void>((resolve) => {
          timer = window.setTimeout(resolve, 1200);
        });
        if (cancelled) return;
        const task = await getTask(started.taskId);
        if (task.status === "done") {
          hooks.onDone?.(parsePolishResult(task.response));
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
