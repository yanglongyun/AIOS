// @ts-nocheck
import { renameChat as renameChatRow } from "../../../repository/chat/chats/index.js";

const renameChat = ({ chatId, title }) => {
  const id = String(chatId || "").trim();
  const nextTitle = String(title || "").trim();
  if (!id) throw new Error("chatId is required");
  if (!nextTitle) throw new Error("title is required");
  return renameChatRow(id, nextTitle);
};

export { renameChat };
