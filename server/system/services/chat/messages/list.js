// @ts-nocheck
import { listMessages } from "../../../repository/chat/messages/index.js";

const listChatMessages = ({ chatId, limit = 50, offset = 0, order = "asc", recent = false } = {}) => {
  const id = String(chatId || "").trim();
  if (!id) throw new Error("chatId is required");
  return listMessages({ chatId: id, limit, offset, order, recent });
};

export { listChatMessages };
