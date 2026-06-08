// @ts-nocheck
import { deleteChat } from "../../services/chat/index.js";
import { readJsonBody, requireField } from "./shared.js";

const handleChatDelete = async (req, res, { readBody, sendJson }) => {
  const body = await readJsonBody(req, readBody, "server.chat.delete.body");
  if (!requireField(body, "chatId", sendJson, res)) return;
  deleteChat({ chatId: body.chatId });
  sendJson(res, 200, { ok: true });
};

export { handleChatDelete };
