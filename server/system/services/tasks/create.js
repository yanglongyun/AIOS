// @ts-nocheck
import { chat } from "../../ai/index.js";
import {
  createTaskRow,
  markTaskAborted,
  markTaskDone,
  markTaskError,
  markTaskRunning,
} from "../../repository/tasks/index.js";
import { buildSystemPrompt } from "../prompt/index.js";
import { createSubscription, fireTaskSubscriptions } from "../subscriptions/index.js";
import { maybeCompactBeforeRun } from "../chat/compactions.js";
import { getChatRunConfig } from "../chat/send/config.js";
import {
  registerTaskExecution,
  unregisterTaskExecution,
} from "./execution.js";
import { listTaskMessages, saveTaskMessages } from "./messages/index.js";

const sanitizeTaskName = (taskName) => {
  const value = String(taskName || "").trim();
  if (!value) throw new Error("taskName is required");
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "task";
};

const createInitialMessages = ({ detail, messages }) => {
  if (Array.isArray(messages)) return messages;
  const content = String(detail || "").trim();
  return content ? [{ role: "user", content }] : [];
};

const getLastAssistantMessage = (messages = []) => {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]?.role === "assistant") return messages[index];
  }
  return null;
};

const handleTaskAiEvent = ({ taskId, event }) => {
  if (event.type === "tool_calls") {
    if (event.message) saveTaskMessages({ taskId, source: "ai", messages: [event.message], usage: event.usage || null });
    return;
  }

  if (event.type === "tool_results") {
    const messages = event.messages || [];
    if (messages.length) saveTaskMessages({ taskId, source: "tool", messages });
    return;
  }

  if (event.type === "done" && event.message) {
    saveTaskMessages({
      taskId,
      source: "ai",
      messages: [event.message],
      usage: event.usage || null,
    });
  }
};

const runTaskAi = async ({ taskId, initialMessages, input, signal }) => {
  const settings = getChatRunConfig(input);
  const systemMessage = {
    role: "system",
    content: buildSystemPrompt("", initialMessages, settings),
  };
  const result = await chat([systemMessage, ...initialMessages], {
    ...settings,
    signal,
    responseFormat: { type: "json_object" },
    beforeModelCall: async ({ lastUsage, round }) => {
      if (!lastUsage || round <= 1) return null;
      const compacted = await maybeCompactBeforeRun({ chatId: taskId, usage: lastUsage, settings, signal });
      if (!compacted) return null;
      const latestEnd = Number(compacted.end_message_id || 0);
      const rows = listTaskMessages({ taskId, limit: 10000, order: "asc" }).messages
        .filter((row) => Number(row.id || 0) > latestEnd)
        .map((row) => row.message);
      return [systemMessage, ...rows];
    },
    onEvent: (event) => handleTaskAiEvent({ taskId, event }),
  });
  const lastAssistant = getLastAssistantMessage(result.messages);
  return lastAssistant?.content || result.text || "";
};

const createTask = ({ taskName, detail, messages, inputOverrides = {}, subscription = null }) => {
  const name = sanitizeTaskName(taskName);
  const initialMessages = createInitialMessages({ detail, messages });
  if (initialMessages.length === 0) {
    throw new Error("detail is required");
  }

  const taskId = createTaskRow({
    name,
    prompt: initialMessages.find((message) => message.role === "user")?.content || "",
  });
  saveTaskMessages({ taskId, source: "user", messages: initialMessages });
  const subscriptionId = subscription?.chatId
    ? createSubscription({ taskId, chatId: subscription.chatId })
    : null;

  const controller = new AbortController();
  registerTaskExecution(taskId, controller);
  markTaskRunning(taskId);

  const run = async () => {
    try {
      const response = await runTaskAi({
        taskId,
        initialMessages,
        input: inputOverrides,
        signal: controller.signal,
      });
      markTaskDone(taskId, response);
      await fireTaskSubscriptions({
        taskId,
        taskName: name,
        status: "done",
        response,
      });
    } catch (error) {
      if (error?.name === "AbortError") {
        markTaskAborted(taskId);
        await fireTaskSubscriptions({
          taskId,
          taskName: name,
          status: "aborted",
        });
      } else {
        markTaskError(taskId, error.message);
        await fireTaskSubscriptions({
          taskId,
          taskName: name,
          status: "error",
          error: error.message,
        });
      }
    } finally {
      unregisterTaskExecution(taskId);
    }
  };

  void run();
  return { taskId, taskName: name, subscriptionId };
};

export { createTask };
