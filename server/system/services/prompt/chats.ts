// @ts-nocheck
import { getChat } from "../../repository/chats/index.js";

const chats = (conversationId) => {
  const chat = getChat(conversationId);
  if (!chat) return "";

  const lines = ["", "## 当前会话", `<conversation>`];
  lines.push(`conversationId: ${chat.id || conversationId || ""}`);
  lines.push(`title: ${chat.title || ""}`);
  lines.push(`summary: ${chat.summary || ""}`);
  lines.push("</conversation>");
  return lines.join("\n");
};

export { chats };
