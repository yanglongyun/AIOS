// @ts-nocheck
import { renameChat } from "../../services/chat/index.js";
import { readJsonBody, requireField } from "./shared.js";

const handleChatRename = async (req, res, { readBody, sendJson }) => {
  const body = await readJsonBody(req, readBody, "server.chat.rename.body");
  if (!requireField(body, "chatId", sendJson, res)) return;
  if (!requireField(body, "title", sendJson, res)) return;
  const chat = renameChat({ chatId: body.chatId, title: body.title });
  sendJson(res, 200, { ok: true, chat });
};

export { handleChatRename };
