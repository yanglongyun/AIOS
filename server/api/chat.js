// @ts-nocheck
import { createChat, deleteChat, listChatMessages, listChats, listCompactions } from "../service/chat/index.js";
import { readJsonBody } from "../utils/http.js";

const asLimit = (value, fallback = 20) => Math.max(1, Math.min(100, Math.floor(Number(value || fallback))));
const asOffset = (value) => Math.max(0, Math.floor(Number(value || 0)));

const handleChatApi = async (req, res, { sendJson }, path, method, url) => {
  if (path === "/api/chat/list" && method === "GET") {
    sendJson(res, 200, listChats({ app: url.searchParams.get("app") || "chat" }));
    return;
  }

  if (path === "/api/chat/create" && method === "POST") {
    const body = await readJsonBody(req);
    const chat = createChat({ title: body.title || "New chat", app: body.app || "chat", meta: body.meta || null, chatId: body.chatId || null });
    sendJson(res, 200, { chatId: chat.id, chat });
    return;
  }

  if (path === "/api/chat/messages" && method === "GET") {
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
    return;
  }

  if (path === "/api/chat/compactions" && method === "GET") {
    const chatId = url.searchParams.get("chatId");
    if (!chatId) {
      sendJson(res, 400, { error: "Missing chatId" });
      return;
    }
    sendJson(res, 200, listCompactions(chatId));
    return;
  }

  if (path === "/api/chat/delete" && method === "POST") {
    const body = await readJsonBody(req);
    deleteChat({ chatId: body.chatId });
    sendJson(res, 200, { ok: true });
    return;
  }

  sendJson(res, 404, { error: "API endpoint not found" });
};

export { handleChatApi };
