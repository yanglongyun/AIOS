import { chat } from "../../ai/handler.js";
import { broadcast } from "../runtime/ws.js";
import { getSettings } from "../settings/get.js";
import { buildSystemPrompt } from "../prompt/index.js";
import { getMessages, saveMessage } from "./store.js";
import { setChatState } from "./conversations.js";
import { extractRemark } from "./remarks.js";

const runConversation = async ({ conversationId, appContext = "" }) => {
  const settings = getSettings();
  const {
    contextRounds,
    apiUrl,
    apiKey,
    model,
    enableToolResultTruncate,
    toolResultMaxChars,
    enableToolLoopLimit,
    toolMaxRounds,
  } = settings;
  const historyMessages = getMessages(conversationId, contextRounds);
  const modelMessages = [{
    role: "system",
    content: buildSystemPrompt(conversationId, { appContext }),
  }, ...historyMessages];
  const abortController = new AbortController();

  setChatState(conversationId, "running");
  broadcast({ type: "chat_changed", conversationId });

  const send = (msg) => {
    if (msg.type === "assistant_tool_calls") {
      if (msg.message) saveMessage(conversationId, msg.message, null);
      return;
    }
    if (msg.type === "tool_call") {
      broadcast({ type: "tool_call", conversationId, toolCall: msg.toolCall });
      return;
    }
    if (msg.type === "tool_result") {
      if (msg.message) saveMessage(conversationId, msg.message, null);
      broadcast({
        type: "tool_result",
        conversationId,
        toolCallId: msg.message?.tool_call_id,
        content: msg.message?.content ?? "",
      });
      return;
    }
    if (msg.type === "done") {
      if (msg.message) {
        const raw = String(msg.message.content || "");
        const { content, remark } = extractRemark(raw);
        const cleanMsg = { ...msg.message, content };
        saveMessage(conversationId, cleanMsg, null, remark);
        const doneMsg = {
          type: "done",
          conversationId,
          content,
          message: cleanMsg,
        };
        if (remark) doneMsg.remark = remark;
        broadcast(doneMsg);
        return;
      }
      broadcast({ type: "done", conversationId });
    }
  };

  try {
    await chat(modelMessages, {
      apiUrl,
      apiKey,
      model,
      send,
      signal: abortController.signal,
      maxRounds: enableToolLoopLimit ? toolMaxRounds : 1e5,
      enableToolResultTruncate,
      toolResultMaxChars,
    });
  } catch (error) {
    broadcast({
      type: "error",
      conversationId,
      content: error?.message || "触发器唤醒失败",
    });
  } finally {
    setChatState(conversationId, "idle");
    broadcast({ type: "chat_changed", conversationId });
  }
};

export {
  runConversation,
};
