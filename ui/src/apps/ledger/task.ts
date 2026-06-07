type TaskState = { status: string; response?: string; error?: string };
type TaskStart = { taskId: number; chatId: string };
type SmartInputResult = { created: Array<{ type: "income" | "expense"; amount: number; category: string; note?: string; occurredOn?: string }>; raw: string };

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

const parseSmartInputResult = (response: unknown): SmartInputResult => {
  const raw = String(response || "").trim();
  const parsed = JSON.parse(raw) as Omit<SmartInputResult, "raw">;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("任务结果不是 JSON 对象");
  return { ...parsed, raw };
};

export function runSmartInputTask(
  input: string,
  hooks: {
    onStart?: () => void;
    onDone?: (result: SmartInputResult) => void | Promise<void>;
    onError?: (message: string) => void;
    onSettled?: () => void;
  },
): { cancel: () => void } {
  const detail = [
    "你是 AIOS 的系统智能任务。请把用户的自然语言记账输入解析成一条或多条账目。",
    "解析字段: type 为 income 或 expense; amount 为正数; category 为简短分类; note 为原始备注或补充说明; occurredOn 为 YYYY-MM-DD,没有明确日期则省略。",
    "解析后,用 shell 调用本机记账应用接口创建账目(后端地址见系统环境段):",
    "POST /apps/ledger/entries,body 为 JSON: {\"type\":\"expense\",\"amount\":35,\"category\":\"餐饮\",\"note\":\"午饭\",\"occurredOn\":\"2026-06-06\"}",
    "只创建账目,不要做消费分析。",
    "最终返回 JSON 对象,结构必须是: {\"created\":[{\"type\":\"expense\",\"amount\":35,\"category\":\"餐饮\",\"note\":\"午饭\",\"occurredOn\":\"2026-06-06\"}]}。",
    "",
    input,
  ].join("\n");
  let cancelled = false;
  let timer: number | undefined;

  (async () => {
    try {
      const started = await startTask("ledger.smart-input", detail);
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
          await hooks.onDone?.(parseSmartInputResult(task.response));
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
