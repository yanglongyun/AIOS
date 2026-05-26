import { getSettings } from "../settings/get.js";
import { broadcast } from "../runtime/ws.js";
import { parseJson } from "../../../shared/json/parse.js";
import { getTaskById, updateTaskPending, updateTaskDone, updateTaskError, updateTaskAborted } from "../../repository/task/records.js";
import { listMessagesByConversationId, saveTaskMessage } from "../../repository/task/messages.js";
import { registerTaskExecution, unregisterTaskExecution } from "./execution.js";
import { executeAgentTask } from "./executors/agent.js";
import { publishMonitorEvent } from "../monitors/deliver.js";
import { createMonitor } from "../monitors/create.js";

const taskMessages = (conversationId) => {
  return listMessagesByConversationId(conversationId)
    .map((row) => parseJson(row.message, "task.message"))
    .filter((message) => message && ["system", "user", "assistant", "tool"].includes(message.role));
};

const continueTask = async ({ id, content, monitor = null }) => {
  const taskId = Number(id || 0);
  if (!Number.isInteger(taskId) || taskId <= 0) {
    return { status: 400, message: "Invalid id" };
  }
  const text = String(content || "").trim();
  if (!text) return { status: 400, message: "content is required" };

  const task = getTaskById(taskId);
  if (!task) return { status: 404, message: "Task not found" };
  if (task.status === "pending") return { status: 400, message: "Task is running" };

  if (monitor && typeof monitor === "object") {
    createMonitor({
      ...monitor,
      kind: "task",
      sourceId: taskId,
      event: monitor.event || "done",
    });
  }

  const conversationId = task.conversation_id;
  const originalPayload = parseJson(task.payload, "task.payload") || {};
  const userMessage = { role: "user", content: text };
  saveTaskMessage(conversationId, userMessage, { phase: "continue" });
  updateTaskPending({ taskId });
  broadcast({ type: "tasks_changed" });

  const abortController = new AbortController();
  registerTaskExecution(taskId, abortController);

  const exec = async () => {
    try {
      const messages = taskMessages(conversationId);
      const settings = getSettings();
      const result = await executeAgentTask({
        messages,
        settings,
        signal: abortController.signal,
        responseFormat: originalPayload.response_format || null,
        emitMessage: (message) => {
          if (message) saveTaskMessage(conversationId, message);
        },
      });
      if (result?.assistantMessage) saveTaskMessage(conversationId, result.assistantMessage);
      const response = result?.response ?? "";
      updateTaskDone({ taskId, response });
      publishMonitorEvent({
        kind: "task",
        sourceId: taskId,
        event: "done",
        payload: { taskId, app: task.app, title: task.title, response },
      });
      broadcast({ type: "tasks_changed" });
      return response;
    } catch (error) {
      if (error?.name === "AbortError") {
        updateTaskAborted({ taskId });
        publishMonitorEvent({
          kind: "task",
          sourceId: taskId,
          event: "aborted",
          payload: { taskId, app: task.app, title: task.title, error: "用户中止任务" },
        });
      } else {
        const message = error?.message || "任务继续执行失败";
        updateTaskError({ taskId, message });
        publishMonitorEvent({
          kind: "task",
          sourceId: taskId,
          event: "error",
          payload: { taskId, app: task.app, title: task.title, error: message },
        });
      }
      broadcast({ type: "tasks_changed" });
    } finally {
      unregisterTaskExecution(taskId);
    }
  };

  exec().catch(() => {});
  return { success: true, id: taskId, conversationId };
};

export {
  continueTask,
};
