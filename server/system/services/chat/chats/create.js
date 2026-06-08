// @ts-nocheck
import { createChat as insertChat } from "../../../repository/chat/chats/index.js";

const createChat = ({ id = null, title = "新对话", app = "chat", meta = null } = {}) =>
  insertChat(String(title || "").trim() || "新对话", app, meta, id);

export { createChat };
