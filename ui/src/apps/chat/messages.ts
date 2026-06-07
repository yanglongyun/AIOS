import type { ChatMessageRecord, DisplayMessage, Message, ToolCall } from "./types";

const SHELL_TOOL_NAMES = new Set(["shell"]);

const parseToolArgs = (raw: unknown) => {
  if (typeof raw !== "string" || !raw) return null;
  try {
    return JSON.parse(raw) as Record<string, any>;
  } catch {
    return null;
  }
};

const pickToolSummary = (args: Record<string, any> | null) => {
  if (!args) return "";
  for (const key of ["summary", "reason"]) {
    const value = args[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
};

const contentFromMessage = (message: Message) => {
  if (typeof message.content === "string") return message.content;
  return "";
};

const usageFromRecord = (record: ChatMessageRecord) => {
  const usage = record.usage;
  return usage && typeof usage === "object" && !Array.isArray(usage)
    ? usage
    : undefined;
};

export const buildToolMessage = (toolCall: ToolCall | undefined, id: string): DisplayMessage => {
  const name = toolCall?.function?.name || "";
  const args = parseToolArgs(toolCall?.function?.arguments);
  const isShell = SHELL_TOOL_NAMES.has(name) && args && args.command;
  const summary = pickToolSummary(args);
  const sub = args?.sessionId
    ? `session ${String(args.sessionId).slice(0, 8)}`
    : args?.signal
      ? `signal ${args.signal}`
      : "";

  return {
    role: "tool",
    source: "tool",
    id,
    toolCallId: toolCall?.id || "",
    toolName: name || "tool",
    toolSummary: summary,
    toolSub: sub,
    shell: !!isShell,
    command: isShell ? String(args.command) : "",
    args: args && !isShell ? JSON.stringify(args, null, 2) : "",
    result: null,
    expanded: false,
  };
};

export const normalizeForDisplay = (raw: ChatMessageRecord[]) => {
  const out: DisplayMessage[] = [];
  if (!Array.isArray(raw)) return out;

  for (const record of raw) {
    if (!record || typeof record !== "object" || !record.message) continue;
    const msg = record.message;
    const baseId = `db:${record.id}`;
    const source = record.source;
    const content = contentFromMessage(msg);
    const usage = usageFromRecord(record);

    if (msg.role === "system") continue;

    if (msg.role === "assistant" && Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) {
      if (content) {
        out.push({
          role: "assistant",
          source: source || "ai",
          content,
          id: `${baseId}:a`,
          memo: msg.memo,
          usage,
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
          source: "tool",
          id: `${baseId}:tr`,
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
        source: source || "user",
        content,
        id: `${baseId}:u`,
      });
      continue;
    }

    if (msg.role === "assistant" && content) {
      out.push({
        role: "assistant",
        source: source || "ai",
        content,
        id: `${baseId}:a`,
        memo: msg.memo,
        usage,
      });
    }
  }

  return out;
};

export const titleFromPrompt = (text: string) => {
  const trimmed = String(text || "").trim();
  return trimmed.slice(0, 24) || "untitled";
};
