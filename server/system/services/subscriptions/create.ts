// @ts-nocheck
import { getChat } from "../../repository/chat/chats/index.js";
import { createSubscriptionRow } from "../../repository/subscriptions/index.js";

const createSubscription = ({ taskId, chatId }) => {
  const id = Number(taskId);
  const targetChatId = String(chatId || "").trim();
  if (!Number.isInteger(id) || id <= 0) throw new Error("taskId is required");
  if (!targetChatId) throw new Error("chatId is required");
  if (!getChat(targetChatId)) throw new Error("subscription chat not found");
  return createSubscriptionRow({ taskId: id, chatId: targetChatId });
};

export { createSubscription };
