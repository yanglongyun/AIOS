// @ts-nocheck
import { listChatMessages } from "../../services/chat/index.js";
import { asLimit, asOffset } from "./shared.js";

const handleChatMessages = async (_req, res, { sendJson }, url) => {
  const chatId = url.searchParams.get("chatId");
  if (!chatId) {
    sendJson(res, 400, { error: "Missing chatId" });
    return;
  }
  sendJson(res, 200, listChatMessages({
    chatId,
    limit: asLimit(url.searchParams.get("limit"), 20),
    offset: asOffset(url.searchParams.get("offset")),
    recent: true,
  }));
};

export { handleChatMessages };
