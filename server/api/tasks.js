// @ts-nocheck
import { abortTask, createTask, getTask, getTaskChatId, listTasks } from "../service/tasks/index.js";
import { listChatMessages } from "../service/chat/index.js";
import { readJsonBody } from "../utils/http.js";

const readLimit = (value) => Math.max(1, Math.min(500, Number.parseInt(value, 10) || 100));

const handleTasksApi = async (req, res, { sendJson }, path, method, url) => {
  if (path !== "/api/tasks") {
    sendJson(res, 404, { error: "API endpoint not found" });
    return;
  }

  if (method === "GET") {
    const id = url.searchParams.get("id");
    if (id) {
      const task = getTask(id);
      if (!task) {
        sendJson(res, 404, { error: "task not found" });
        return;
      }
      const taskChatId = getTaskChatId(task.id);
      const messages = listChatMessages({ chatId: taskChatId, limit: 200, order: "asc" }).messages;
      sendJson(res, 200, { ok: true, task: { ...task, chatId: taskChatId }, messages });
      return;
    }
    sendJson(res, 200, { ok: true, tasks: listTasks({ limit: readLimit(url.searchParams.get("limit")) }) });
    return;
  }

  if (method === "POST") {
    const body = await readJsonBody(req);
    const result = createTask({
      name: body.name || body.taskName,
      prompt: body.prompt || body.detail,
      messages: body.messages,
      inputOverrides: body.config || body,
      subscription: body.subscription || null,
    });
    sendJson(res, 202, { ok: true, accepted: true, ...result });
    return;
  }

  if (method === "PATCH") {
    const id = url.searchParams.get("id");
    const body = await readJsonBody(req);
    if (!id) {
      sendJson(res, 400, { error: "Missing task id" });
      return;
    }
    if (body.status !== "aborted") {
      sendJson(res, 400, { error: "Unsupported task status" });
      return;
    }
    sendJson(res, 200, { ok: true, task: abortTask(id) });
    return;
  }

  sendJson(res, 404, { error: "API endpoint not found" });
};

export { handleTasksApi };
