// @ts-nocheck
import { saveMessageBatch } from "../../../repository/chat/messages/index.js";

const messageSources = new Set(["user", "ai", "tool", "subscription"]);

const normalizeSource = (source) => {
  const value = String(source || "").trim();
  if (!messageSources.has(value)) throw new Error("message source is required");
  return value;
};

const saveChatMessages = ({ chatId, source, messages, usage = null, meta = null }) => {
  const id = String(chatId || "").trim();
  if (!id) throw new Error("chatId is required");
  const nextMeta = {
    ...(meta || {}),
    source: normalizeSource(source),
    ...(usage ? { usage } : {}),
  };
  saveMessageBatch(id, Array.isArray(messages) ? messages : [], nextMeta);
  return { ok: true };
};

export { saveChatMessages };
