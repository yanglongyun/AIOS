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
import { publishTriggerEvent } from "../triggers/deliver.js";
import { createTrigger } from "../triggers/create.js";

const createTaskRun = async ({
  mode,
  app,
  title = "",
  payload,
  meta = null,
  wait = true,
  trigger = null,
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
  let triggerId = null;
  if (trigger && typeof trigger === "object") {
    const created = createTrigger({
      ...trigger,
      kind: "task",
      sourceId: taskId,
      event: trigger.event || "done",
    });
    triggerId = created?.id || null;
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
      publishTriggerEvent({
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
        publishTriggerEvent({
          kind: "task",
          sourceId: taskId,
          event: "aborted",
          payload: { taskId, app, title, error: "用户中止任务" },
        });
      } else {
        const message = error?.message || errorMessage;
        updateTaskError({ taskId, message });
        publishTriggerEvent({
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
    return { id: taskId, conversationId, triggerId, response: null };
  }

  const response = await exec();
  return { id: taskId, conversationId, triggerId, response };
};

export {
  createTaskRun
};
