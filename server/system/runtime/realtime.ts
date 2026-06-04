// @ts-nocheck
// 模块级实时 hub:WS 客户端、会话广播、运行中的会话。
// 同时被 WS 连接处理器(用户对话)和监视器投递层(唤醒会话)共享。
import WebSocket from "ws";
import { runConversationChat } from "../services/chat/index.js";

const clients = new Set();
const runningChats = new Map();

const sendJson = (ws, payload) => {
  if (ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify(payload));
};

// 按 conversationId 广播给订阅了该会话的客户端
const broadcast = (conversationId, payload) => {
  for (const client of clients) {
    if (!client.subscriptions.has(conversationId)) continue;
    sendJson(client.ws, { conversationId, ...payload });
  }
};

// 全局广播(monitors_changed / tasks_changed 等无会话维度的事件)
const broadcastAll = (payload) => {
  for (const client of clients) sendJson(client.ws, payload);
};

const registerClient = (ws) => {
  const client = { ws, subscriptions: new Set() };
  clients.add(client);
  return client;
};

const removeClient = (client) => {
  clients.delete(client);
};

const subscribe = (client, conversationId) => {
  client.subscriptions.add(conversationId);
  sendJson(client.ws, { type: "chat.subscribed", ok: true, conversationId });
};

const unsubscribe = (client, conversationId) => {
  client.subscriptions.delete(conversationId);
  sendJson(client.ws, { type: "chat.unsubscribed", ok: true, conversationId });
};

const stopChat = (conversationId) => {
  const controller = runningChats.get(conversationId);
  if (controller) controller.abort();
};

const isChatRunning = (conversationId) => runningChats.has(conversationId);

// 把 ai 的事件流转成 WS 广播(用户对话与监视器唤醒共用同一套)
const buildOnEvent = (conversationId) => (event) => {
  if (
    event.type === "assistant_tool_calls" ||
    event.type === "tool_result" ||
    event.type === "done"
  ) {
    broadcast(conversationId, { type: "chat.message", ok: true, message: event.message });
    return;
  }
  if (event.type === "delta") {
    broadcast(conversationId, { type: "chat.delta", ok: true, delta: event.delta });
    return;
  }
  if (event.type === "usage") {
    broadcast(conversationId, { type: "chat.usage", ok: true, usage: event.usage });
    return;
  }
  if (event.type === "saved") {
    broadcast(conversationId, { type: "chat.saved", ok: true });
    return;
  }
  if (event.type === "end") {
    broadcast(conversationId, { type: "chat.end", ok: true });
    return;
  }
  if (event.type === "stopped") {
    broadcast(conversationId, { type: "chat.stopped", ok: true });
  }
};

// 运行一个会话并把事件广播出去;runningChats 做并发互斥
const runConversation = async (conversationId, input = {}, { broadcastUserPrompt = false } = {}) => {
  if (runningChats.has(conversationId)) {
    return { ok: false, error: "chat already running" };
  }
  const controller = new AbortController();
  runningChats.set(conversationId, controller);

  const prompt = String(input.prompt || "").trim();
  if (broadcastUserPrompt && prompt) {
    broadcast(conversationId, {
      type: "chat.message",
      ok: true,
      message: { role: "user", content: prompt },
    });
  }

  try {
    await runConversationChat(conversationId, input, {
      signal: controller.signal,
      onEvent: buildOnEvent(conversationId),
    });
    return { ok: true };
  } catch (error) {
    if (error?.name !== "AbortError") {
      broadcast(conversationId, { type: "chat.error", ok: false, error: error.message });
    }
    return { ok: false, error: error?.message };
  } finally {
    runningChats.delete(conversationId);
  }
};

// WS 入口:用户发消息
const handleChatSend = async (client, payload) => {
  const conversationId = String(payload.conversationId || "").trim();
  if (!conversationId) {
    sendJson(client.ws, { type: "chat.error", ok: false, error: "invalid conversationId" });
    return;
  }
  subscribe(client, conversationId);
  if (runningChats.has(conversationId)) {
    sendJson(client.ws, {
      type: "chat.error",
      ok: false,
      conversationId,
      error: "chat already running",
    });
    return;
  }
  await runConversation(conversationId, payload, { broadcastUserPrompt: true });
};

// 监视器入口:监视消息已落库,这里只负责唤醒 AI 接着处理
const wakeConversation = (conversationId) =>
  runConversation(conversationId, {}, { broadcastUserPrompt: false });

export {
  sendJson,
  broadcast,
  broadcastAll,
  registerClient,
  removeClient,
  subscribe,
  unsubscribe,
  stopChat,
  isChatRunning,
  handleChatSend,
  wakeConversation,
};
