import type { DisplayMessage, Message, MonitorMeta, ToolCall } from "../api";

const SHELL_TOOL_NAMES = new Set(["shell"]);

// 判断一条消息是否为监视器回灌消息(REST 走 _meta,WS 实时走 meta,兜底看 [MONITOR] 前缀)
export const isMonitorMessage = (msg: any): boolean =>
  msg?._meta?.source === "monitor" ||
  msg?.meta?.source === "monitor" ||
  (typeof msg?.content === "string" && msg.content.trimStart().startsWith("[MONITOR]"));

// 把 [MONITOR]…[END] 文本解析成结构,供卡片展示
export const parseMonitorContent = (content: string): MonitorMeta => {
  const lines = String(content || "").split("\n");
  let title = "";
  let event = "";
  const body: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "[MONITOR]" || trimmed === "[END]") continue;
    const t = trimmed.match(/^监视器[：:]\s*(.*)$/);
    if (t) { title = t[1]; continue; }
    const e = trimmed.match(/^事件[：:]\s*(.*)$/);
    if (e) { event = e[1]; continue; }
    body.push(line);
  }
  return { title: title || "监视器", event: event || "事件", body: body.join("\n").trim() };
};

const parseToolArgs = (raw: unknown) => {
  if (typeof raw !== "string" || !raw) return null;
  try {
    return JSON.parse(raw) as Record<string, any>;
  } catch {
    return null;
  }
};

const contentFromMessage = (message: Message) => {
  if (typeof message.content === "string") return message.content;
  if (typeof message.message !== "string") return "";
  try {
    const parsed = JSON.parse(message.message);
    return typeof parsed.content === "string" ? parsed.content : message.message;
  } catch {
    return message.message;
  }
};

export const buildToolMessage = (toolCall: ToolCall | undefined, id: string): DisplayMessage => {
  const name = toolCall?.function?.name || "";
  const args = parseToolArgs(toolCall?.function?.arguments);
  const isShell = SHELL_TOOL_NAMES.has(name) && args && args.command;
  const sub = args?.sessionId
    ? `session ${String(args.sessionId).slice(0, 8)}`
    : args?.signal
      ? `signal ${args.signal}`
      : "";

  return {
    role: "tool",
    _id: id,
    toolCallId: toolCall?.id || "",
    toolName: name || "tool",
    toolSub: sub,
    shell: !!isShell,
    command: isShell ? String(args.command) : "",
    args: args && !isShell ? JSON.stringify(args, null, 2) : "",
    result: null,
    expanded: false,
  };
};

export const normalizeForDisplay = (raw: Message[]) => {
  const out: DisplayMessage[] = [];
  if (!Array.isArray(raw)) return out;

  for (const msg of raw) {
    if (!msg || typeof msg !== "object") continue;
    const dbId = msg._id ?? msg.id;
    const baseId = dbId != null ? `db:${dbId}` : `mem:${Math.random()}`;
    const content = contentFromMessage(msg);

    if (msg.role === "system") continue;

    if (msg.role === "assistant" && Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) {
      if (content) {
        out.push({
          role: "assistant",
          content,
          _id: `${baseId}:a`,
          memo: msg.memo,
        });
      }
      msg.tool_calls.forEach((tc, index) => {
        out.push(buildToolMessage(tc, `${baseId}:tc:${index}`));
      });
      continue;
    }

    if (msg.role === "tool") {
      let target = -1;
      if (msg.tool_call_id) {
        for (let index = out.length - 1; index >= 0; index -= 1) {
          if (out[index].role === "tool" && out[index].toolCallId === msg.tool_call_id) {
            target = index;
            break;
          }
        }
      }
      if (target < 0) {
        for (let index = out.length - 1; index >= 0; index -= 1) {
          if (out[index].role === "tool" && out[index].result == null) {
            target = index;
            break;
          }
        }
      }
      if (target >= 0) {
        out[target].result = content ?? "";
      } else {
        out.push({
          role: "tool",
          _id: `${baseId}:tr`,
          toolName: "tool",
          orphan: true,
          result: content ?? "",
          expanded: false,
        });
      }
      continue;
    }

    if (msg.role === "user" && content) {
      out.push({
        role: "user",
        content,
        _id: `${baseId}:u`,
        ...(isMonitorMessage(msg) ? { monitor: parseMonitorContent(content) } : {}),
      });
      continue;
    }

    if (msg.role === "assistant" && content) {
      out.push({
        role: "assistant",
        content,
        _id: `${baseId}:a`,
        memo: msg.memo,
      });
    }
  }

  return out;
};

export const previewText = (value: unknown, fallback = "暂无内容") => {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return fallback;
  return text.length > 120 ? `${text.slice(0, 120)}...` : text;
};

export const formatTime = (value: unknown) => {
  if (!value) return "--";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const titleFromPrompt = (text: string) => {
  const trimmed = String(text || "").trim();
  return trimmed.slice(0, 24) || "untitled";
};
