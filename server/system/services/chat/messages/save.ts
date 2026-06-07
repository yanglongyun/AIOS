// @ts-nocheck
import { saveMessageBatch } from "../../../repository/chat/messages/index.js";

const saveChatMessages = ({ chatId, source, messages, usage = null }) => {
  const id = String(chatId || "").trim();
  if (!id) throw new Error("chatId is required");
  saveMessageBatch(id, source, Array.isArray(messages) ? messages : [], usage);
  return { ok: true };
};

export { saveChatMessages };
