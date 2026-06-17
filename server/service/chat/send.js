// @ts-nocheck
import { chat } from "../../ai/index.js";
import { buildSystemPrompt } from "./prompt.js";
import { getChat, setChatState } from "./chats.js";
import { appendChatMessage, listChatMessages, saveChatMessages } from "./messages.js";
import { maybeCompactBeforeRun } from "./compactions.js";
import { getLatestCompaction } from "../../repository/chat/compactions/index.js";
import { abortChat } from "./abort.js";
import { getChatRunConfig } from "./config.js";
import { chatControllers } from "./controllers.js";
import { normalizeAttachments } from "./attachments.js";

const readUserContent = (input = {}) => String(input.prompt ?? "");
const readUserSource = (input = {}) => String(input.source || "").trim();
const readUserKind = (source) => (source === "subscription" || source === "task" ? "task" : "message");
const readAttachments = (input = {}) => normalizeAttachments(input.attachments);

const appendAttachmentInstruction = (content, attachments = []) => {
  if (!attachments.length) return String(content || "");
  const lines = attachments
    .filter((item) => item?.path)
    .map((item, index) => `${index + 1}. ${item.name || "file"}: ${item.path}`);
  if (!lines.length) return String(content || "");
  return `${String(content || "")}

附件文件路径：
如果回答依赖附件内容，请先读取这些文件。
${lines.join("\n")}`;
};

const readMessageMeta = (input = {}) => {
  const attachments = readAttachments(input);
  return attachments.length ? { attachments } : null;
};

const readModelMessage = (item) => {
  const message = item?.message && typeof item.message === "object" ? item.message : item;
  const attachments = normalizeAttachments(item?.meta?.attachments);
  if (message?.role === "user" && attachments.length) {
    return { role: "user", content: appendAttachmentInstruction(message.content, attachments) };
  }
  return message;
};

const readModelMessages = (items = []) => (Array.isArray(items) ? items.map(readModelMessage) : []);

const unreadCompactedRows = (chatId, rows = []) => {
  const latest = getLatestCompaction(chatId);
  const latestEnd = Number(latest?.end_message_id || 0);
  return rows.filter((row) => Number(row?.id || 0) > latestEnd);
};

const waitForChatIdle = async (chatId) => {
  while (chatControllers.has(chatId)) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
};

const readLatestUsage = (rows = []) => {
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    const row = rows[index];
    if (row?.message?.role !== "assistant") continue;
    const usage = row?.usage;
    if (usage && Number(usage.total_tokens || 0) > 0) return usage;
  }
  return null;
};

const prepareChatInput = ({ chatId, input = {}, includePendingUser = true }) => {
  const settings = getChatRunConfig(input.config || input);
  const history = Array.isArray(input.messages)
    ? input.messages
    : listChatMessages({ chatId, limit: 200, order: "asc" }).messages;
  const rawContextRows = Array.isArray(input.messages) ? history : unreadCompactedRows(chatId, history);
  const contextMessages = readModelMessages(rawContextRows);
  const userContent = readUserContent(input);
  const attachments = readAttachments(input);
  const userMessage = userContent || attachments.length ? { role: "user", content: userContent } : null;
  const userSource = userMessage ? readUserSource(input) : "";
  const userKind = userMessage ? readUserKind(userSource) : "";
  const userMeta = userMessage ? { ...(readMessageMeta(input) || {}), kind: userKind, source: userSource } : null;
  const modelUserMessage = includePendingUser && userMessage
    ? { role: "user", content: appendAttachmentInstruction(userContent, attachments) }
    : null;
  const systemMessage = {
    role: "system",
    content: buildSystemPrompt(chatId, contextMessages, settings),
  };

  return {
    settings,
    userMessage,
    userSource,
    userKind,
    userMeta,
    latestUsage: readLatestUsage(history),
    modelMessages: [
      systemMessage,
      ...contextMessages,
      ...(modelUserMessage ? [modelUserMessage] : []),
    ],
  };
};

const handleAiEvent = ({ chatId, event, emit, runState }) => {
  if (event.type === "message") {
    emit({ type: "message", chatId, content: event.content || "" });
    return;
  }
  if (event.type === "tool_calls") {
    if (event.message) saveChatMessages({ chatId, source: "ai", messages: [event.message], usage: event.usage || null });
    emit({ type: "tool_calls", chatId, toolCalls: event.message?.tool_calls || [] });
    return;
  }
  if (event.type === "tool_results") {
    const messages = event.messages || [];
    if (messages.length) saveChatMessages({ chatId, source: "tool", messages });
    emit({
      type: "tool_results",
      chatId,
      results: messages.map((message) => ({
        toolCallId: message?.tool_call_id || "",
        content: message?.content ?? "",
      })),
    });
    return;
  }
  if (event.type === "usage") {
    emit({ type: "usage", chatId, usage: event.usage || {} });
    return;
  }
  if (event.type === "done") {
    if (event.message) {
      saveChatMessages({
        chatId,
        source: "ai",
        messages: [event.message],
        usage: event.usage || null,
      });
    }
    if (runState) runState.done = true;
  }
};

const sendChatMessage = async (chatId, input = {}, options = {}) => {
  const id = String(chatId || "").trim();
  if (!id) throw new Error("chatId is required");
  if (!getChat(id)) throw new Error("chat not found");
  if (chatControllers.has(id)) {
    abortChat(id);
    await waitForChatIdle(id);
  }

  const emit = options.emit || (() => {});
  const throwOnError = options.throwOnError !== false;
  const runState = { done: false };
  let controller = null;

  try {
    const initial = prepareChatInput({ chatId: id, input, includePendingUser: false });
    controller = new AbortController();
    const signal = options.signal || controller.signal;
    chatControllers.set(id, controller);
    setChatState({ chatId: id, state: "running" });

    await maybeCompactBeforeRun({ chatId: id, usage: initial.latestUsage, settings: initial.settings, emit, signal });

    if (initial.userMessage) {
      const messageId = appendChatMessage({
        chatId: id,
        message: initial.userMessage,
        meta: initial.userMeta,
      });
      emit({
        type: "input",
        chatId: id,
        id: messageId,
        kind: initial.userKind || "message",
        message: initial.userMessage,
        meta: initial.userMeta,
      });
    }

    const prepared = prepareChatInput({ chatId: id, input, includePendingUser: false });
    emit({ type: "start", chatId: id });

    const result = await chat(prepared.modelMessages, {
      ...prepared.settings,
      signal,
      beforeModelCall: async ({ lastUsage, round }) => {
        if (!lastUsage || round <= 1) return null;
        const compacted = await maybeCompactBeforeRun({ chatId: id, usage: lastUsage, settings: initial.settings, emit, signal });
        if (!compacted) return null;
        return prepareChatInput({ chatId: id, input, includePendingUser: false }).modelMessages;
      },
      onEvent: (event) => handleAiEvent({ chatId: id, event, emit, runState }),
    });
    emit({ type: "done", chatId: id });
    return { result, chatId: id };
  } catch (error) {
    if (error?.name === "AbortError") emit({ type: "aborted", chatId: id });
    else emit({ type: "error", chatId: id, content: error.message });
    if (!throwOnError) return { result: null, chatId: id, error };
    throw error;
  } finally {
    if (controller) {
      chatControllers.delete(id);
      setChatState({ chatId: id, state: "idle" });
    }
  }
};

export { sendChatMessage };
