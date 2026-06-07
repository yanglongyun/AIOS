// @ts-nocheck
import { appendMessage } from "../../../repository/chat/messages/index.js";

const appendChatMessage = ({ chatId, source, message, usage = null }) => {
  const id = String(chatId || "").trim();
  if (!id) throw new Error("chatId is required");
  return appendMessage(id, source, message, usage);
};

export { appendChatMessage };
