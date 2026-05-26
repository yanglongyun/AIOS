import { randomUUID } from "crypto";
import { broadcast } from "../runtime/ws.js";
import {
  insertTaskRecord,
  updateTaskAborted,
  updateTaskDone,
  updateTaskError
} from "../../repository/task/records.js";
import { saveTaskMessage } from "../../repository/task/messages.js";
import { registerTaskExecution, unregisterTaskExecution } from "./execution.js";
import { publishMonitorEvent } from "../monitors/deliver.js";
import { createMonitor } from "../monitors/create.js";

const createTaskRun = async ({
  mode,
  app,
  title = "",
  payload,
  meta = null,
  wait = true,
  monitor = null,
  execute,
  errorMessage = "Task execution failed"
}) => {
  const conversationId = `task:${randomUUID().slice(0, 8)}`;
  const { taskId } = insertTaskRecord({
    conversationId,
    app,
    title,
    mode,
    payload,
    meta
  });
  let monitorId = null;
  if (monitor && typeof monitor === "object") {
    const created = createMonitor({
      ...monitor,
      kind: "task",
      sourceId: taskId,
      event: monitor.event || "done",
    });
    monitorId = created?.id || null;
  }
  broadcast({ type: "tasks_changed" });

  const abortController = new AbortController();
  registerTaskExecution(taskId, abortController);

  const emitMessage = (message, metaValue = null) => {
    if (message) saveTaskMessage(conversationId, message, metaValue);
  };

  const exec = async () => {
    try {
      if (Array.isArray(payload?.messages)) {
        for (const message of payload.messages) emitMessage(message, { phase: "request" });
      }
      const result = await execute({
        conversationId,
        emitMessage,
        signal: abortController.signal
      });
      if (result?.assistantMessage) emitMessage(result.assistantMessage, null);
      const response = result?.response ?? "";
      updateTaskDone({ taskId, response });
      publishMonitorEvent({
        kind: "task",
        sourceId: taskId,
        event: "done",
        payload: { taskId, app, title, response },
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
          payload: { taskId, app, title, error: "用户中止任务" },
        });
      } else {
        const message = error?.message || errorMessage;
        updateTaskError({ taskId, message });
        publishMonitorEvent({
          kind: "task",
          sourceId: taskId,
          event: "error",
          payload: { taskId, app, title, error: message },
        });
      }
      broadcast({ type: "tasks_changed" });
      if (wait) throw error;
      return null;
    } finally {
      unregisterTaskExecution(taskId);
    }
  };

  if (!wait) {
    exec().catch(() => {});
    return { id: taskId, conversationId, monitorId, response: null };
  }

  const response = await exec();
  return { id: taskId, conversationId, monitorId, response };
};

export {
  createTaskRun
};
