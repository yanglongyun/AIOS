// @ts-nocheck
import {
  listActiveSubscriptionsByTask,
  markSubscriptionFired,
} from "../../repository/subscriptions/index.js";
import { sendChatMessage } from "../chat/index.js";
import { broadcastWebSocketEvent } from "../../ws/index.js";

const buildSubscriptionPrompt = ({
  taskId,
  taskName,
  taskChatId,
  status,
  response = "",
  error = "",
}) => {
  const lines = [
    "后台任务状态更新。",
    "",
    `taskId: ${taskId}`,
    `taskName: ${taskName || ""}`,
    `taskChatId: ${taskChatId || ""}`,
    `status: ${status}`,
  ];
  if (response) {
    lines.push("", "response:", String(response));
  }
  if (error) {
    lines.push("", "error:", String(error));
  }
  lines.push("", "请根据这次任务结果继续处理当前对话。");
  return lines.join("\n");
};

const fireTaskSubscriptions = async (task) => {
  const subscriptions = listActiveSubscriptionsByTask(task.taskId);
  if (subscriptions.length === 0) return;

  const prompt = buildSubscriptionPrompt(task);
  for (const subscription of subscriptions) {
    try {
      await sendChatMessage(subscription.chat_id, { prompt, source: "subscription" }, {
        emit: broadcastWebSocketEvent,
        throwOnError: false,
      });
      markSubscriptionFired(subscription.id);
    } catch (error) {
      console.error(`subscription ${subscription.id} delivery failed: ${error.message}`);
    }
  }
};

export { fireTaskSubscriptions };
