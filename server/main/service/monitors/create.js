import { insertMonitor } from "../../repository/monitors.js";

const VALID_STATUS = new Set(["active", "fired", "paused", "deleted"]);
const VALID_KIND = new Set(["task", "schedule"]);
const VALID_EVENT = new Set(["done", "error", "aborted", "time"]);
const VALID_TARGET_MODE = new Set(["existing_chat", "new_chat"]);
const VALID_CREATED_BY = new Set(["ai", "app", "user", "system"]);

const pick = (value, allowed, fallback) => {
  const text = String(value || "").trim();
  return allowed.has(text) ? text : fallback;
};

const createMonitor = (body = {}) => {
  const targetMode = pick(body.targetMode ?? body.target_mode, VALID_TARGET_MODE, "existing_chat");
  const conversationId = String(body.conversationId ?? body.conversation_id ?? "").trim();
  if (targetMode === "existing_chat" && !conversationId) {
    throw new Error("conversationId is required");
  }
  const sourceIdRaw = body.sourceId ?? body.source_id;
  const sourceId = sourceIdRaw == null || sourceIdRaw === "" ? null : String(sourceIdRaw);
  const result = insertMonitor({
    title: String(body.title || "").trim(),
    kind: pick(body.kind, VALID_KIND, "task"),
    sourceId,
    event: pick(body.event, VALID_EVENT, "done"),
    targetMode,
    conversationId: conversationId || null,
    chatTitle: String(body.chatTitle ?? body.chat_title ?? "").trim(),
    prompt: String(body.prompt || "").trim(),
    createdByType: pick(body.createdByType ?? body.created_by_type, VALID_CREATED_BY, "ai"),
    createdByRef: body.createdByRef ?? body.created_by_ref ?? null,
  });
  return { success: true, id: result.id };
};

export {
  VALID_STATUS,
  createMonitor,
};
