// @ts-nocheck
import { chat } from "../../../ai/index.js";
import { buildSystemPrompt } from "../../prompt/index.js";
import { getChat, setChatState } from "../chats/index.js";
import { appendChatMessage, listChatMessages, saveChatMessages } from "../messages/index.js";
import { abortChat } from "./abort.js";
import { getChatRunConfig } from "./config.js";
import { chatControllers } from "./controllers.js";

const limitMessagesByTurns = (messages, contextTurns) => {
  const turns = Math.max(0, Number.parseInt(contextTurns, 10) || 0);
  if (!Array.isArray(messages) || turns === 0) return Array.isArray(messages) ? messages : [];

  let remaining = turns;
  let startIndex = 0;
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]?.role === "user") {
      remaining -= 1;
      startIndex = index;
      if (remaining === 0) break;
    }
  }
  return remaining > 0 ? messages : messages.slice(startIndex);
};

const readUserContent = (input = {}) => String(input.prompt ?? "");
const readUserSource = (input = {}) => String(input.source || "").trim();
const readAttachments = (input = {}) => Array.isArray(input.attachments) ? input.attachments : [];
const appendAttachmentInstruction = (content, attachments = []) => {
  if (!attachments.length) return String(content || "");
  const lines = attachments
    .filter((item) => item?.path)
    .map((item, index) => `${index + 1}. ${item.name || "file"}: ${item.path}`);
  if (!lines.length) return String(content || "");
  return `${String(content || "")}

【附件文件路径】
请先读取这些文件内容，再结合用户问题回答。
${lines.join("\n")}`;
};
const readMessageMeta = (input = {}) => {
  const attachments = readAttachments(input);
  return attachments.length ? { attachments } : null;
};
const readModelMessage = (item) => {
  const message = item?.message && typeof item.message === "object" ? item.message : item;
  const attachments = Array.isArray(item?.meta?.attachments) ? item.meta.attachments : [];
  if (message?.role === "user" && attachments.length) {
    return { role: "user", content: appendAttachmentInstruction(message.content, attachments) };
  }
  return message;
};
const readModelMessages = (items = []) => (Array.isArray(items) ? items.map(readModelMessage) : []);

const waitForChatIdle = async (chatId) => {
  while (chatControllers.has(chatId)) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
};

const prepareChatInput = ({ chatId, input = {} }) => {
  const settings = getChatRunConfig(input);

  const history = Array.isArray(input.messages)
    ? input.messages
    : listChatMessages({ chatId, limit: 200, order: "asc" }).messages;
  const contextMessages = limitMessagesByTurns(readModelMessages(history), settings.contextTurns);
  const userContent = readUserContent(input);
  const attachments = readAttachments(input);
  const userMessage = userContent || attachments.length ? { role: "user", content: userContent } : null;
  const userSource = userMessage ? readUserSource(input) : "";
  const userMeta = userMessage ? { ...(readMessageMeta(input) || {}), source: userSource } : null;
  const modelUserMessage = userMessage
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
    userMeta,
    modelMessages: [
      systemMessage,
      ...contextMessages,
      ...(modelUserMessage ? [modelUserMessage] : []),
    ],
  };
};

const handleAiEvent = ({ chatId, event, emit }) => {
  if (event.type === "message") {
    emit({ type: "message", chatId, content: event.content || "" });
    return;
  }

  if (event.type === "tool_calls") {
    if (event.message) saveChatMessages({ chatId, source: "ai", messages: [event.message] });
    emit({
      type: "tool_calls",
      chatId,
      toolCalls: event.message?.tool_calls || [],
    });
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
    emit({ type: "done", chatId });
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
  const responseFormat = options.responseFormat || null;
  const throwOnError = options.throwOnError !== false;

  try {
    const prepared = prepareChatInput({ chatId: id, input });
    const controller = new AbortController();
    const signal = options.signal || controller.signal;

    chatControllers.set(id, controller);
    setChatState({ chatId: id, state: "running" });

    if (prepared.userMessage) {
      const messageId = appendChatMessage({
        chatId: id,
        source: prepared.userSource,
        message: prepared.userMessage,
        meta: prepared.userMeta,
      });
      emit({
        type: "input",
        chatId: id,
        id: messageId,
        message: prepared.userMessage,
        meta: prepared.userMeta,
      });
    }
    emit({ type: "start", chatId: id });

    const result = await chat(prepared.modelMessages, {
      ...prepared.settings,
      signal,
      responseFormat,
      onEvent: (event) => handleAiEvent({ chatId: id, event, emit }),
    });

    return { result, chatId: id };
  } catch (error) {
    if (error?.name === "AbortError") {
      emit({ type: "aborted", chatId: id });
    } else {
      emit({ type: "error", chatId: id, code: error.code || "", content: error.message });
    }
    if (!throwOnError) return { result: null, chatId: id, error };
    throw error;
  } finally {
    chatControllers.delete(id);
    setChatState({ chatId: id, state: "idle" });
  }
};

export { sendChatMessage };
