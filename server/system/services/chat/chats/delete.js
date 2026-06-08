// @ts-nocheck
import { deleteChat as removeChat } from "../../../repository/chat/chats/index.js";

const deleteChat = ({ chatId }) => {
  const id = String(chatId || "").trim();
  if (!id) throw new Error("chatId is required");
  removeChat(id);
  return { ok: true };
};

export { deleteChat };
