// @ts-nocheck
// 浏览器控制桥:AGENT 作为 hub,Chrome 扩展(client=extension)作为执行端。
//   server → 扩展:{ type:'tool.call', id, name, args }
//   扩展 → server:{ id, type:'tool.result', result } / { id, type:'tool.error', error }
// 同一时刻只保留一个扩展连接;按 id 关联请求与回包。
import { randomUUID } from "node:crypto";
import WebSocket from "ws";

// 扩展暴露的浏览器能力(与 meem/extension 的 tools/index.js 对齐)。
const BROWSER_TOOLS = [
  { name: "browser_open", description: "打开网址(新标签,前台),等加载完成" },
  { name: "browser_read", description: "读取当前页可见文本" },
  { name: "browser_click", description: "按 CSS 选择器或文本点击元素" },
  { name: "browser_fill", description: "往输入框填值" },
  { name: "browser_screenshot", description: "截取当前页" },
  { name: "browser_tabs", description: "列出标签页" },
  { name: "browser_navigate", description: "当前标签导航到网址" },
  { name: "browser_evaluate", description: "在页面执行 JS 表达式并取值" },
];

let extensionWs = null;
let connectedAt = null;
const pending = new Map(); // id -> { resolve, reject, timer }

const isConnected = () => !!extensionWs && extensionWs.readyState === WebSocket.OPEN;

const rejectAllPending = (reason) => {
  for (const [id, entry] of pending) {
    clearTimeout(entry.timer);
    entry.reject(new Error(reason));
    pending.delete(id);
  }
};

const registerExtension = (ws) => {
  if (extensionWs && extensionWs !== ws) {
    try { extensionWs.close(); } catch { /* ignore */ }
  }
  extensionWs = ws;
  connectedAt = new Date().toISOString();
};

const unregisterExtension = (ws) => {
  if (extensionWs !== ws) return;
  extensionWs = null;
  connectedAt = null;
  rejectAllPending("浏览器扩展已断开");
};

// 处理扩展回包(tool.result / tool.error)。
const handleFrame = (frame = {}) => {
  const id = frame.id;
  if (!id || !pending.has(id)) return;
  const entry = pending.get(id);
  clearTimeout(entry.timer);
  pending.delete(id);
  if (frame.type === "tool.error") entry.reject(new Error(frame.error || "tool error"));
  else entry.resolve(frame.result);
};

const callTool = (name, args = {}, timeoutMs = 30000) => new Promise((resolve, reject) => {
  if (!isConnected()) {
    reject(new Error("浏览器扩展未连接"));
    return;
  }
  const id = randomUUID();
  const timer = setTimeout(() => {
    pending.delete(id);
    reject(new Error("浏览器工具调用超时"));
  }, timeoutMs);
  pending.set(id, { resolve, reject, timer });
  try {
    extensionWs.send(JSON.stringify({ type: "tool.call", id, name, args }));
  } catch (error) {
    clearTimeout(timer);
    pending.delete(id);
    reject(error);
  }
});

const browserStatus = () => ({
  connected: isConnected(),
  connectedAt,
  tools: BROWSER_TOOLS,
});

// 扩展连接的传输处理(ws/index.js 在握手 ?client=extension 时调用):
// 登记连接、ping→pong、把 tool.result/error 转给桥;断开时注销。
const bindExtension = (ws) => {
  registerExtension(ws);
  ws.on("message", (raw) => {
    let frame;
    try { frame = JSON.parse(String(raw || "{}")); } catch { return; }
    if (frame.type === "ping") {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "pong" }));
      return;
    }
    if (frame.type === "tool.result" || frame.type === "tool.error") handleFrame(frame);
  });
  ws.on("close", () => unregisterExtension(ws));
  ws.on("error", () => unregisterExtension(ws));
};

export {
  BROWSER_TOOLS,
  bindExtension,
  browserStatus,
  callTool,
  isConnected,
};
