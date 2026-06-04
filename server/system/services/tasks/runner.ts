// @ts-nocheck
import { randomUUID } from "crypto";
import { saveMessageBatch } from "../../repository/messages/index.js";
import {
  createTaskRow,
  markTaskAborted,
  markTaskDone,
  markTaskError,
  markTaskRunning,
} from "../../repository/tasks/index.js";
import { createMonitor, publishMonitorEvent } from "../monitors/index.js";
import {
  registerTaskExecution,
  unregisterTaskExecution,
} from "./execution.js";

const createTaskRun = ({
  taskName,
  initialMessages,
  input,
  execute,
  monitor = null,
}) => {
  const conversationId = randomUUID();
  saveMessageBatch(conversationId, initialMessages);
  const taskId = createTaskRow({
    conversationId,
    name: taskName,
    prompt: initialMessages.find((message) => message.role === "user")?.content || "",
  });

  // 可选:为这个任务登记一个监视器(任务结束时回灌目标会话)
  let monitorId = null;
  if (monitor && typeof monitor === "object") {
    try {
      const created = createMonitor({
        ...monitor,
        kind: "task",
        sourceId: String(taskId),
        event: monitor.event || "done",
        createdByType: monitor.createdByType || "task",
        createdByRef: String(taskId),
      });
      monitorId = created?.id || null;
    } catch (error) {
      // 监视器登记失败不应阻断任务本身
      console.error(`monitor register failed for task ${taskId}: ${error.message}`);
    }
  }

  const controller = new AbortController();
  registerTaskExecution(taskId, controller);
  markTaskRunning(taskId);

  const run = async () => {
    try {
      const result = await execute({
        conversationId,
        input: {
          conversationId,
          messages: initialMessages,
          ...input,
        },
        signal: controller.signal,
      });
      const response = result?.response || "";
      markTaskDone(taskId, response);
      publishMonitorEvent({
        kind: "task",
        sourceId: String(taskId),
        event: "done",
        payload: { taskId, name: taskName, response },
      });
    } catch (error) {
      if (error?.name === "AbortError") {
        markTaskAborted(taskId);
        publishMonitorEvent({
          kind: "task",
          sourceId: String(taskId),
          event: "aborted",
          payload: { taskId, name: taskName, error: "用户中止任务" },
        });
      } else {
        markTaskError(taskId, error.message);
        publishMonitorEvent({
          kind: "task",
          sourceId: String(taskId),
          event: "error",
          payload: { taskId, name: taskName, error: error.message },
        });
      }
    } finally {
      unregisterTaskExecution(taskId);
    }
  };

  void run();
  return { taskId, taskName, conversationId, monitorId };
};

export { createTaskRun };
