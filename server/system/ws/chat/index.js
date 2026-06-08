// @ts-nocheck
import { abortChat, sendChatMessage } from "../../services/chat/index.js";

const readChatId = (payload = {}) => String(payload.chatId || "").trim();

const handleMissingChatId = (emit) => {
  emit({ type: "socket.error", content: "Missing chatId" });
};

const handleChatAbort = async ({ payload, emit }) => {
  const chatId = readChatId(payload);
  if (!chatId) {
    handleMissingChatId(emit);
    return;
  }

  abortChat(chatId);
};

const handleChatMessage = async ({ payload, emit }) => {
  const chatId = readChatId(payload);
  if (!chatId) {
    handleMissingChatId(emit);
    return;
  }

  await sendChatMessage(chatId, { ...payload, source: "user" }, { emit, throwOnError: false });
};

const chatWebSocketHandlers = {
  "chat.message": handleChatMessage,
  "chat.abort": handleChatAbort,
};

export { chatWebSocketHandlers };
