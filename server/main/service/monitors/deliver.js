import { broadcast } from "../runtime/ws.js";
import { createChat } from "../chat/conversations.js";
import { saveMessage } from "../chat/store.js";
import { runConversation } from "../chat/run.js";
import {
  findActiveMonitorRows,
  markMonitorError,
  markMonitorFired,
} from "../../repository/monitors.js";

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

const buildMonitorMessage = (monitor, { event, payload }) => {
  const title = monitor.title || monitor.chat_title || "监视器";
  const payloadText = stringifyPayload(payload);
  const lines = [
    "[MONITOR]",
    `监视器：${title}`,
    `事件：${EVENT_LABELS[event] || event}`,
  ];
  if (monitor.prompt) {
    lines.push("", "指令：", monitor.prompt);
  }
  if (payloadText) {
    lines.push("", "事件内容：", payloadText);
  }
  lines.push("[END]");
  return lines.join("\n");
};

const resolveConversationId = (monitor) => {
  if (monitor.target_mode === "new_chat") {
    const title = monitor.chat_title || monitor.title || "监视器";
    const created = createChat(title, "chat", {
      source: "monitor",
      monitorId: monitor.id,
      createdByType: monitor.created_by_type,
      createdByRef: monitor.created_by_ref,
    });
    return created.conversationId;
  }
  return String(monitor.conversation_id || "").trim();
};

const deliverMonitor = async (monitor, eventData) => {
  try {
    const conversationId = resolveConversationId(monitor);
    if (!conversationId) throw new Error("conversation_id is required");
    const content = buildMonitorMessage(monitor, eventData);
    const meta = {
      source: "monitor",
      synthetic: true,
      monitorId: monitor.id,
      kind: monitor.kind,
      sourceId: monitor.source_id,
      event: eventData.event,
      createdByType: monitor.created_by_type,
      createdByRef: monitor.created_by_ref,
    };
    const saved = saveMessage(conversationId, { role: "user", content }, meta);
    markMonitorFired({ id: monitor.id, conversationId, messageId: saved.id });
    broadcast({ type: "monitors_changed" });
    broadcast({ type: "chat_changed", conversationId });
    runConversation({ conversationId }).catch((error) => {
      markMonitorError({ id: monitor.id, error: error?.message || String(error) });
      broadcast({ type: "monitors_changed" });
    });
  } catch (error) {
    markMonitorError({ id: monitor.id, error: error?.message || String(error) });
    broadcast({ type: "monitors_changed" });
  }
};

const publishMonitorEvent = ({ kind = "task", sourceId, event, payload = null }) => {
  const monitors = findActiveMonitorRows({ kind, sourceId, event });
  for (const monitor of monitors) {
    deliverMonitor(monitor, { kind, sourceId, event, payload });
  }
  return { delivered: monitors.length };
};

export {
  publishMonitorEvent,
};
