import { chat } from "../agent/handler.js";
import { getModelSetupStatus, getSettings } from "../service/settings/get.js";
import { buildSystemPrompt } from "../prompt/index.js";
import { injectAttachmentsMessage } from "./attachments.js";
import { getMessages, saveMessage } from "./messages.js";
import { hasChat } from "./chats.js";

const MODEL_FIELD_LABELS = {
  provider: "provider",
  model: "model",
  apiUrl: "API URL",
  apiKey: "API Key"
};

const buildMissingModelMessage = (status) => {
  const missing = (status?.missing || []).map((key) => MODEL_FIELD_LABELS[key] || key);
  const missingText = missing.length ? missing.join(" / ") : "provider / model / API URL / API Key";
  return [
    "当前还没有配置内置聊天模型，所以这条消息暂时不能由 AIOS 内置对话来处理。",
    "",
    `缺少字段：${missingText}`,
    "",
    "请先打开“设置”应用，在里面补全大模型配置。",
    "配好之后，回到这里重新发送就可以继续使用 AIOS 内置聊天。",
    "",
    "如果你希望直接用外部 agent 作为 AIOS 的内核来驱动系统，也可以把这个 welcome API 链接交给它：",
    "   [http://127.0.0.1:9502/welcome](http://127.0.0.1:9502/welcome)",
    "",
    "这个接口会返回 AIOS 的架构、可用应用、coding agents 状态和调用方式。"
  ].join("\n");
};

const createSession = (wsSend) => {
  const conversations = /* @__PURE__ */ new Map();
  const handleMessage = async (data) => {
    if (data.type === "ping") {
      wsSend({ type: "pong" });
      return;
    }
    if (data.type === "abort") {
      const cid = data.conversationId;
      if (cid && conversations.has(cid)) {
        conversations.get(cid).abortController.abort();
      }
      return;
    }
    if (data.type === "message") {
      const cid = data.conversationId || null;
      if (!cid) {
        wsSend({ type: "error", content: "Missing conversationId" });
        return;
      }
      if (!hasChat(cid)) {
        wsSend({ type: "error", content: "Conversation not found. Create a new conversation and try again." });
        return;
      }
      if (conversations.has(cid)) {
        conversations.get(cid).abortController.abort();
        await new Promise((r) => {
          const check = () => conversations.has(cid) ? setTimeout(check, 50) : r();
          check();
        });
      }
      const settings = getSettings();
      const setupStatus = getModelSetupStatus();
      if (!setupStatus.configured) {
        const userMsg = { role: "user", content: data.content };
        let userMeta = null;
        if (Array.isArray(data.attachments) && data.attachments.length > 0) {
          const injected = injectAttachmentsMessage([userMsg], data.attachments);
          if (injected.attachments.length > 0) {
            userMeta = { attachments: injected.attachments };
          }
        }
        saveMessage(cid, userMsg, userMeta);
        const assistantMsg = {
          role: "assistant",
          content: buildMissingModelMessage(setupStatus)
        };
        saveMessage(cid, assistantMsg);
        wsSend({
          type: "done",
          conversationId: cid,
          content: assistantMsg.content
        });
        return;
      }
      const {
        contextRounds,
        apiUrl,
        apiKey,
        model,
        provider,
        enableToolResultTruncate,
        toolResultMaxChars,
        enableToolLoopLimit,
        toolMaxRounds
      } = settings;
      const historyMessages = getMessages(cid, contextRounds).map((message) => {
        if (message?.role !== "user") return message;
        const attachments = Array.isArray(message._meta?.attachments) ? message._meta.attachments : [];
        if (!attachments.length) return message;
        const injected = injectAttachmentsMessage([message], attachments);
        return injected.messages[0] || message;
      });
      const messages = [{
        role: "system",
        content: buildSystemPrompt(cid)
      }, ...historyMessages];
      const userMsg = { role: "user", content: data.content };
      let userMeta = null;
      let modelUserMsg = userMsg;
      if (Array.isArray(data.attachments) && data.attachments.length > 0) {
        const injected = injectAttachmentsMessage([userMsg], data.attachments);
        modelUserMsg = injected.messages[0] || userMsg;
        if (injected.attachments.length > 0) {
          userMeta = { attachments: injected.attachments };
        }
      }
      messages.push(userMsg);
      const modelMessages = [...messages];
      modelMessages[modelMessages.length - 1] = modelUserMsg;
      saveMessage(cid, userMsg, userMeta);
      const abortController = new AbortController();
      conversations.set(cid, { abortController });
      const send = (msg) => {
        if (msg.type === "delta") {
          wsSend({ type: "delta", conversationId: cid, delta: msg.delta || "" });
          return;
        }
        if (msg.type === "assistant_tool_calls") {
          if (msg.message) saveMessage(cid, msg.message, null);
          return;
        }
        if (msg.type === "tool_call") {
          wsSend({ type: "tool_call", conversationId: cid, toolCall: msg.toolCall });
          return;
        }
        if (msg.type === "tool_result") {
          if (msg.message) saveMessage(cid, msg.message, null);
          wsSend({
            type: "tool_result",
            conversationId: cid,
            toolCallId: msg.message?.tool_call_id,
            content: msg.message?.content ?? ""
          });
          return;
        }
        if (msg.type === "done") {
          if (msg.message) {
            const rawContent = String(msg.message.content || "");
            saveMessage(cid, msg.message);
            wsSend({
              type: "done",
              conversationId: cid,
              content: rawContent
            });
            return;
          }
          wsSend({ type: "done", conversationId: cid });
          return;
        }
      };
      try {
        await chat(modelMessages, {
          provider,
          apiUrl,
          apiKey,
          model,
          send,
          signal: abortController.signal,
          maxRounds: enableToolLoopLimit ? toolMaxRounds : 1e5,
          enableToolResultTruncate,
          toolResultMaxChars
        });
      } catch (e) {
        if (e.name === "AbortError") {
          wsSend({ type: "aborted", conversationId: cid });
        } else {
          wsSend({ type: "error", conversationId: cid, content: e.message });
        }
      } finally {
        conversations.delete(cid);
      }
    }
  };
  return { handleMessage };
};
export {
  createSession
};
