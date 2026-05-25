import { broadcast } from "../runtime/ws.js";
import { createChat } from "../chat/conversations.js";
import { saveMessage } from "../chat/store.js";
import { runConversation } from "../chat/run.js";
import {
  findActiveTriggerRows,
  markTriggerError,
  markTriggerFired,
} from "../../repository/triggers.js";

const EVENT_LABELS = {
  done: "任务已完成",
  error: "任务失败",
  aborted: "任务已中止",
  time: "时间已到",
};

const stringifyPayload = (payload) => {
  if (payload == null || payload === "") return "";
  if (typeof payload === "string") return payload;
  return JSON.stringify(payload, null, 2);
};

const buildTriggerMessage = (trigger, { event, payload }) => {
  const title = trigger.title || trigger.chat_title || "触发器";
  const payloadText = stringifyPayload(payload);
  const lines = [
    "[TRIGGER]",
    `触发器：${title}`,
    `事件：${EVENT_LABELS[event] || event}`,
  ];
  if (trigger.prompt) {
    lines.push("", "指令：", trigger.prompt);
  }
  if (payloadText) {
    lines.push("", "事件内容：", payloadText);
  }
  lines.push("[END]");
  return lines.join("\n");
};

const resolveConversationId = (trigger) => {
  if (trigger.target_mode === "new_chat") {
    const title = trigger.chat_title || trigger.title || "触发器";
    const created = createChat(title, "chat", {
      source: "trigger",
      triggerId: trigger.id,
      createdByType: trigger.created_by_type,
      createdByRef: trigger.created_by_ref,
    });
    return created.conversationId;
  }
  return String(trigger.conversation_id || "").trim();
};

const deliverTrigger = async (trigger, eventData) => {
  try {
    const conversationId = resolveConversationId(trigger);
    if (!conversationId) throw new Error("conversation_id is required");
    const content = buildTriggerMessage(trigger, eventData);
    const meta = {
      source: "trigger",
      synthetic: true,
      triggerId: trigger.id,
      kind: trigger.kind,
      sourceId: trigger.source_id,
      event: eventData.event,
      createdByType: trigger.created_by_type,
      createdByRef: trigger.created_by_ref,
    };
    const saved = saveMessage(conversationId, { role: "user", content }, meta);
    markTriggerFired({ id: trigger.id, conversationId, messageId: saved.id });
    broadcast({ type: "triggers_changed" });
    broadcast({ type: "chat_changed", conversationId });
    runConversation({ conversationId }).catch((error) => {
      markTriggerError({ id: trigger.id, error: error?.message || String(error) });
      broadcast({ type: "triggers_changed" });
    });
  } catch (error) {
    markTriggerError({ id: trigger.id, error: error?.message || String(error) });
    broadcast({ type: "triggers_changed" });
  }
};

const publishTriggerEvent = ({ kind = "task", sourceId, event, payload = null }) => {
  const triggers = findActiveTriggerRows({ kind, sourceId, event });
  for (const trigger of triggers) {
    deliverTrigger(trigger, { kind, sourceId, event, payload });
  }
  return { delivered: triggers.length };
};

export {
  publishTriggerEvent,
};
