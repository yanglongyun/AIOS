// @ts-nocheck
import { pinChat } from "../../services/chat/index.js";
import { readJsonBody, requireField } from "./shared.js";

const handleChatPin = async (req, res, { readBody, sendJson }) => {
  const body = await readJsonBody(req, readBody, "server.chat.pin.body");
  if (!requireField(body, "chatId", sendJson, res)) return;
  const chat = pinChat({ chatId: body.chatId, pinned: body.pinned });
  sendJson(res, 200, { ok: true, chat });
};

export { handleChatPin };
