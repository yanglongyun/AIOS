// @ts-nocheck
import { getChat as findChat } from "../../../repository/chat/chats/index.js";

const getChat = (chatId) => {
  const id = String(chatId || "").trim();
  if (!id) throw new Error("chatId is required");
  return findChat(id);
};

export { getChat };
