// @ts-nocheck
import { updateChatPinned } from "../../../repository/chat/chats/index.js";

const pinChat = ({ chatId, pinned }) => {
  const id = String(chatId || "").trim();
  if (!id) throw new Error("chatId is required");
  return updateChatPinned(id, !!pinned);
};

export { pinChat };
