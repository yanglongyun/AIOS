// @ts-nocheck
import { broadcast, broadcastAll, wakeConversation } from "../../runtime/realtime.js";
import { appendMessage } from "../../repository/messages/index.js";
import { createChat } from "../../repository/chats/index.js";
import {
  findActiveMonitorRows,
  markMonitorFired,
  markMonitorError,
} from "../../repository/monitors/index.js";

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

// 把事件包装成投进会话的 [MONITOR]…[END] 消息
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
    const created = createChat(title);
    return created.id;
  }
  return String(monitor.conversation_id || "").trim();
};

const deliverMonitor = async (monitor, eventData) => {
  try {
    const conversationId = resolveConversationId(monitor);
    if (!conversationId) throw new Error("conversation_id is required");

    const content = buildMonitorMessage(monitor, eventData);
    const message = {
      role: "user",
      content,
      meta: {
        source: "monitor",
        synthetic: true,
        monitorId: monitor.id,
        kind: monitor.kind,
        sourceId: monitor.source_id,
        event: eventData.event,
      },
    };

    const messageId = appendMessage(conversationId, message);
    markMonitorFired({ id: monitor.id, conversationId, messageId });

    // 让监视消息在目标会话里即时出现 + 通知监视器视图刷新
    broadcast(conversationId, { type: "chat.message", ok: true, message });
    broadcastAll({ type: "monitors_changed" });
    broadcastAll({ type: "chat_changed", conversationId });

    // 唤醒 AI 接着处理(非阻塞)
    wakeConversation(conversationId).catch((error) => {
      markMonitorError({ id: monitor.id, error: error?.message || String(error) });
      broadcastAll({ type: "monitors_changed" });
    });
  } catch (error) {
    markMonitorError({ id: monitor.id, error: error?.message || String(error) });
    broadcastAll({ type: "monitors_changed" });
  }
};

// 事件发布:查出所有匹配的 active 监视器逐个投递
const publishMonitorEvent = ({ kind = "task", sourceId, event, payload = null }) => {
  if (sourceId == null) return { delivered: 0 };
  const monitors = findActiveMonitorRows({ kind, sourceId, event });
  for (const monitor of monitors) {
    deliverMonitor(monitor, { kind, sourceId, event, payload });
  }
  return { delivered: monitors.length };
};

export { publishMonitorEvent };
