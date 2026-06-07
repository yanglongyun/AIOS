// @ts-nocheck
import { getChat } from "../../repository/chat/chats/index.js";

const chats = (chatId) => {
  const chat = getChat(chatId);
  if (!chat) return "";

  const lines = ["", "## 当前对话", `<chat>`];
  lines.push(`chatId: ${chat.id || chatId || ""}`);
  lines.push(`title: ${chat.title || ""}`);
  lines.push(`description: ${chat.description || ""}`);
  lines.push("</chat>");
  return lines.join("\n");
};

export { chats };
