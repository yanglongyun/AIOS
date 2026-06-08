// @ts-nocheck
import { createChat } from "../../services/chat/index.js";
import { readJsonBody } from "./shared.js";

const handleChatCreate = async (req, res, { readBody, sendJson }) => {
  const body = await readJsonBody(req, readBody, "server.chat.create.body");
  const chat = createChat({
    title: body.title || "新对话",
    app: body.app || "chat",
    meta: body.meta || null,
  });
  sendJson(res, 200, { chatId: chat.id, chat });
};

export { handleChatCreate };
