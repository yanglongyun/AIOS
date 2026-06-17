// @ts-nocheck
import { abortChat, sendChatMessage } from "../../service/chat/index.js";

const readChatId = (payload = {}) => String(payload.chatId || "").trim();

const handleChatAbort = async ({ payload, emit }) => {
  const chatId = readChatId(payload);
  if (!chatId) {
    emit({ type: "socket.error", content: "Missing chatId" });
    return;
  }
  abortChat(chatId);
};

const handleChatMessage = async ({ payload, emit }) => {
  const chatId = readChatId(payload);
  if (!chatId) {
    emit({ type: "socket.error", content: "Missing chatId" });
    return;
  }
  const prompt = payload.prompt ?? payload.text ?? payload.content ?? payload.message?.content ?? "";
  await sendChatMessage(chatId, { ...payload, prompt, source: payload.source || "user" }, { emit, throwOnError: false });
};

const chatWebSocketHandlers = {
  send: handleChatMessage,
  "chat.message": handleChatMessage,
  "chat.abort": handleChatAbort,
};

export { chatWebSocketHandlers };
