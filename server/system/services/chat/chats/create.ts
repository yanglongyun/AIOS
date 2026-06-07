// @ts-nocheck
import { createChat as insertChat } from "../../../repository/chat/chats/index.js";

const createChat = ({ title = "新对话", scene = "chat", meta = null } = {}) =>
  insertChat(String(title || "").trim() || "新对话", scene || "chat", meta);

export { createChat };
