// @ts-nocheck
import { getTask, listTaskMessages, listTasks } from "../../services/tasks/index.js";

const handleTasksGet = async (_req, res, { sendJson }, url) => {
  const id = url.searchParams.get("id");
  if (id) {
    const task = getTask(id);
    if (!task) {
      sendJson(res, 404, { ok: false, error: "task not found" });
      return;
    }
    const result = listTaskMessages({ taskId: id, limit: 200, order: "asc" });
    sendJson(res, 200, { ok: true, task, messages: result.messages, total: result.total });
    return;
  }
  const rawLimit = Number.parseInt(url.searchParams.get("limit"), 10);
  const limit = Math.max(1, Math.min(500, Number.isFinite(rawLimit) ? rawLimit : 50));
  const tasks = listTasks({ limit });
  sendJson(res, 200, { ok: true, tasks });
};

export { handleTasksGet };
