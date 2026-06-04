// @ts-nocheck
import { insertMonitorRow } from "../../repository/monitors/index.js";

const VALID_KIND = new Set(["task", "schedule"]);
const VALID_EVENT = new Set(["done", "error", "aborted", "time"]);
const VALID_TARGET_MODE = new Set(["existing_chat", "new_chat"]);

const createMonitor = (input = {}) => {
  const kind = VALID_KIND.has(input.kind) ? input.kind : "task";
  const event = VALID_EVENT.has(input.event) ? input.event : "done";
  const targetMode = VALID_TARGET_MODE.has(input.targetMode) ? input.targetMode : "existing_chat";

  const conversationId = String(input.conversationId || "").trim();
  const chatTitle = String(input.chatTitle || "").trim();

  if (targetMode === "existing_chat" && !conversationId) {
    throw new Error("existing_chat 模式必须提供 conversationId");
  }

  const id = insertMonitorRow({
    title: String(input.title || "").trim() || null,
    status: "active",
    kind,
    sourceId: input.sourceId != null ? String(input.sourceId) : null,
    event,
    targetMode,
    conversationId: conversationId || null,
    chatTitle: chatTitle || null,
    prompt: String(input.prompt || "").trim() || null,
    createdByType: input.createdByType || null,
    createdByRef: input.createdByRef != null ? String(input.createdByRef) : null,
  });

  return { id, kind, event, targetMode, status: "active" };
};

export { createMonitor };
