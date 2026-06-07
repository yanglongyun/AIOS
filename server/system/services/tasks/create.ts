// @ts-nocheck
import { randomUUID } from "crypto";
import { saveMessageBatch } from "../../repository/chat/messages/index.js";
import {
  createTaskRow,
  markTaskAborted,
  markTaskDone,
  markTaskError,
  markTaskRunning,
} from "../../repository/tasks/index.js";
import { createChat, sendChatMessage } from "../chat/index.js";
import { createSubscription, fireTaskSubscriptions } from "../subscriptions/index.js";
import {
  registerTaskExecution,
  unregisterTaskExecution,
} from "./execution.js";

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

const runTaskChat = async ({ chatId, initialMessages, input, signal }) => {
  const { result } = await sendChatMessage(chatId, {
    chatId,
    messages: initialMessages,
    ...input,
    source: "user",
  }, {
    signal,
    emit: () => {},
    responseFormat: { type: "json_object" },
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

  const chatId = randomUUID();
  createChat({
    id: chatId,
    title: name,
    scene: "task",
  });
  saveMessageBatch(chatId, "user", initialMessages);
  const taskId = createTaskRow({
    chatId,
    name,
    prompt: initialMessages.find((message) => message.role === "user")?.content || "",
  });
  const subscriptionId = subscription?.chatId
    ? createSubscription({ taskId, chatId: subscription.chatId })
    : null;

  const controller = new AbortController();
  registerTaskExecution(taskId, controller);
  markTaskRunning(taskId);

  const run = async () => {
    try {
      const response = await runTaskChat({
        chatId,
        initialMessages,
        input: inputOverrides,
        signal: controller.signal,
      });
      markTaskDone(taskId, response);
      await fireTaskSubscriptions({
        taskId,
        taskName: name,
        taskChatId: chatId,
        status: "done",
        response,
      });
    } catch (error) {
      if (error?.name === "AbortError") {
        markTaskAborted(taskId);
        await fireTaskSubscriptions({
          taskId,
          taskName: name,
          taskChatId: chatId,
          status: "aborted",
        });
      } else {
        markTaskError(taskId, error.message);
        await fireTaskSubscriptions({
          taskId,
          taskName: name,
          taskChatId: chatId,
          status: "error",
          error: error.message,
        });
      }
    } finally {
      unregisterTaskExecution(taskId);
    }
  };

  void run();
  return { taskId, taskName: name, chatId, subscriptionId };
};

export { createTask };
