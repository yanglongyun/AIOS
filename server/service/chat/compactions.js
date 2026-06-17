// @ts-nocheck
import { callLlmStream } from "../../ai/llm.js";
import { normalizeMessagesForModel } from "../../ai/utils.js";
import {
  createCompaction,
  getLatestCompaction,
  listCompactions as listStoredCompactions,
} from "../../repository/chat/compactions/index.js";
import { appendMessage, listMessages } from "../../repository/chat/messages/index.js";

const DEFAULT_COMPACT_PROMPT = `你负责压缩一段聊天上下文，供后续大模型继续对话时使用。

请保留：
- 用户明确提出的目标、偏好、限制和已经确认的决策
- 助手已经完成的关键改动、文件路径、接口协议和运行结果
- 工具调用中影响后续工作的事实
- 仍未解决的问题和下一步

请删除寒暄、重复内容、无效中间过程。输出中文摘要，结构清晰，避免编造。`;

const readTotalTokens = (usage = {}) => Number(usage.total_tokens || 0) || 0;

const serializeMessagesForSummary = (rows = []) => rows.map((row) => {
  const message = row?.message || {};
  const role = message.role || "unknown";
  let content = "";
  if (role === "assistant" && Array.isArray(message.tool_calls) && message.tool_calls.length) {
    content = [
      message.content || "",
      `tool_calls: ${JSON.stringify(message.tool_calls)}`,
    ].filter(Boolean).join("\n");
  } else if (role === "tool") {
    content = `tool_call_id: ${message.tool_call_id || ""}\n${message.content || ""}`;
  } else {
    content = message.content || "";
  }
  return `#${row.id} ${role}\n${content}`;
}).join("\n\n---\n\n");

const listCompactions = (chatId) => ({ items: listStoredCompactions(chatId) });

const keepSuffixStart = (rows = []) => {
  if (!rows.length) return 0;
  const last = rows[rows.length - 1]?.message || {};
  if (last.role === "tool") {
    for (let index = rows.length - 1; index >= 0; index -= 1) {
      const message = rows[index]?.message || {};
      if (message.role === "assistant" && Array.isArray(message.tool_calls) && message.tool_calls.length) {
        return index;
      }
    }
  }
  return Math.max(0, rows.length - 1);
};

const maybeCompactBeforeRun = async ({ chatId, usage, settings, emit, signal }) => {
  const threshold = Number(settings.compressThreshold ?? 0) || 0;
  const totalTokens = readTotalTokens(usage);
  if (!chatId || !threshold || !totalTokens || totalTokens < threshold) return null;

  const latest = getLatestCompaction(chatId);
  const latestEnd = Number(latest?.end_message_id || 0);
  const rows = listMessages({ chatId, limit: 10000, order: "asc" }).messages
    .filter((row) => Number(row.id) > latestEnd)
    .filter((row) => row?.meta?.kind !== "compaction");
  const suffixStart = keepSuffixStart(rows);
  if (suffixStart <= 2) return null;

  const candidates = rows.slice(0, suffixStart);
  const startMessageId = candidates[0]?.id;
  const endMessageId = candidates[candidates.length - 1]?.id;
  if (!startMessageId || !endMessageId || endMessageId <= latestEnd) return null;

  const prompt = String(settings.compactPrompt || "").trim() || DEFAULT_COMPACT_PROMPT;
  const summaryInput = serializeMessagesForSummary(candidates);
  const payload = {
    model: settings.model,
    messages: normalizeMessagesForModel([
      { role: "system", content: prompt },
      { role: "user", content: `请压缩以下聊天消息：\n\n${summaryInput}` },
    ], { model: settings.model, apiUrl: settings.apiUrl }),
  };
  emit?.({
    type: "compact_start",
    chatId,
    meta: { startMessageId, endMessageId, totalTokens, threshold },
  });

  try {
    const result = await callLlmStream(settings.apiUrl, settings.apiKey, payload, { signal });
    const summary = String(result.message?.content || "").trim();
    if (!summary) return null;

    const id = createCompaction({
      chatId,
      startMessageId,
      endMessageId,
      summary,
      tokens: readTotalTokens(result.usage),
    });
    const compaction = { id, chat_id: chatId, start_message_id: startMessageId, end_message_id: endMessageId, summary, tokens: readTotalTokens(result.usage) };
    const message = {
      role: "user",
      content: `以下是历史上下文压缩摘要：\n\n${summary}`,
    };
    const meta = {
      kind: "compaction",
      startMessageId,
      endMessageId,
      tokens: compaction.tokens,
      compaction,
    };
    const messageId = appendMessage(chatId, message, meta);
    emit?.({
      type: "input",
      chatId,
      id: messageId,
      kind: "compaction",
      message,
      meta,
    });
    return compaction;
  } finally {
    emit?.({
      type: "compact_done",
      chatId,
      meta: { startMessageId, endMessageId },
    });
  }
};

export { listCompactions, maybeCompactBeforeRun };
