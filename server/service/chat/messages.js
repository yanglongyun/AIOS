// @ts-nocheck
import { appendMessage, listMessages, saveMessageBatch } from "../../repository/chat/messages/index.js";
import { getChat } from "./chats.js";

const appendChatMessage = ({ chatId, message, meta = null }) => appendMessage(chatId, message, meta);

const saveChatMessages = ({ chatId, source = "", messages = [], usage = null, meta = null }) => {
  const nextMeta = {
    ...(meta || {}),
    ...(source ? { source } : {}),
  };
  saveMessageBatch(chatId, Array.isArray(messages) ? messages : [], Object.keys(nextMeta).length ? nextMeta : null, usage);
};

const listChatMessages = (options = {}) => {
  const result = listMessages(options);
  const chat = getChat(options.chatId);
  return {
    ...result,
    state: chat?.state || "idle",
  };
};

export { appendChatMessage, listChatMessages, saveChatMessages };
