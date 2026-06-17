// @ts-nocheck
import {
  createSubscriptionRow,
  listActiveSubscriptionsByTask,
  listSubscriptions as repoListSubscriptions,
  markSubscriptionFired,
} from "../../repository/subscriptions/index.js";
import { sendChatMessage } from "../chat/index.js";
import { broadcastWebSocketEvent } from "../../ws/index.js";

const createSubscription = ({ taskId, chatId }) => {
  const id = Number(taskId);
  const targetChatId = String(chatId || "").trim();
  if (!Number.isInteger(id) || id <= 0) throw new Error("taskId is required");
  if (!targetChatId) throw new Error("chatId is required");
  return createSubscriptionRow({ taskId: id, chatId: targetChatId });
};

const listSubscriptions = ({ limit = 200 } = {}) => repoListSubscriptions({ limit });

const buildSubscriptionPrompt = ({ taskId, taskName, status, response = "", error = "" }) => {
  const lines = [
    "后台任务更新。",
    "",
    `taskId: ${taskId}`,
    `taskName: ${taskName || ""}`,
    `status: ${status}`,
  ];
  if (response) lines.push("", "response:", String(response));
  if (error) lines.push("", "error:", String(error));
  lines.push("", "请基于这个任务结果继续当前聊天。不要把这段内容当成用户亲口说的话。");
  return lines.join("\n");
};

const fireTaskSubscriptions = async (task) => {
  const subscriptions = listActiveSubscriptionsByTask(task.taskId);
  if (!subscriptions.length) return;
  const prompt = buildSubscriptionPrompt(task);
  for (const subscription of subscriptions) {
    await sendChatMessage(subscription.chat_id, { prompt, source: "subscription" }, {
      emit: broadcastWebSocketEvent,
      throwOnError: false,
    });
    markSubscriptionFired(subscription.id);
  }
};

export { createSubscription, fireTaskSubscriptions, listSubscriptions };
