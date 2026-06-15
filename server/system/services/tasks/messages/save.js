// @ts-nocheck
import { saveMessageBatch } from "../../../repository/chat/messages/index.js";

const messageSources = new Set(["user", "ai", "tool"]);

const normalizeSource = (source) => {
  const value = String(source || "").trim();
  if (!messageSources.has(value)) throw new Error("task message source is required");
  return value;
};

const saveTaskMessages = ({ taskId, source, messages, usage = null, meta = null }) => {
  const id = String(taskId || "").trim();
  if (!id) throw new Error("taskId is required");
  const nextMeta = {
    ...(meta || {}),
    source: normalizeSource(source),
  };
  saveMessageBatch(id, Array.isArray(messages) ? messages : [], nextMeta, usage);
  return { ok: true };
};

export { saveTaskMessages };
