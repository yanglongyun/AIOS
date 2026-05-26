import { spawn } from "node:child_process";
import WebSocket from "ws";
import { codexEnv, EXTERNAL_CODEX_URL, REQUEST_TIMEOUT_MS } from "./env.js";
import { handleCodexServerRequest } from "./permissions.js";

let child = null;
let socket = null;
let port = null;
let initialized = false;
let requestId = 1;
let activeTurn = null;
let lastError = "";

const pending = new Map();

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const pickPort = () => 19000 + Math.floor(Math.random() * 3000);
const appServerUrl = () => EXTERNAL_CODEX_URL || `ws://127.0.0.1:${port}`;

const status = () => ({
  running: Boolean(EXTERNAL_CODEX_URL || (child && !child.killed)),
  managed: !EXTERNAL_CODEX_URL,
  connected: socket?.readyState === WebSocket.OPEN,
  initialized,
  port,
  url: initialized || socket ? appServerUrl() : null,
  lastError,
});

const rejectPending = (error) => {
  for (const [id, item] of pending.entries()) {
    clearTimeout(item.timer);
    pending.delete(id);
    item.reject(error);
  }
};

const sendRaw = (payload) => {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    throw new Error("Codex app-server is not connected");
  }
  socket.send(JSON.stringify(payload));
};

const callCodex = (method, params = {}, timeoutMs = REQUEST_TIMEOUT_MS) => {
  const id = requestId++;
  sendRaw({ jsonrpc: "2.0", id, method, params });
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      if (!pending.has(id)) return;
      pending.delete(id);
      reject(new Error(`${method} timeout`));
    }, timeoutMs);
    pending.set(id, { resolve, reject, method, timer });
  });
};

const handleMessage = (raw) => {
  let message;
  try { message = JSON.parse(String(raw)); } catch { return; }

  if (message.id !== undefined && message.method === undefined && pending.has(message.id)) {
    const item = pending.get(message.id);
    pending.delete(message.id);
    clearTimeout(item.timer);
    if (message.error) item.reject(new Error(message.error.message || JSON.stringify(message.error)));
    else item.resolve(message.result);
    return;
  }

  if (message.id !== undefined && message.method !== undefined) {
    activeTurn?.({ method: "server/request", params: message });
    if (handleCodexServerRequest(message, sendRaw)) return;
  }

  if (message.method) activeTurn?.(message);
};

const waitForSocket = async (url) => {
  for (let i = 0; i < 40; i += 1) {
    let ws = null;
    try {
      ws = new WebSocket(url);
      await new Promise((resolve, reject) => {
        let settled = false;
        const timer = setTimeout(() => {
          if (settled) return;
          settled = true;
          try { ws.close(); } catch {}
          reject(new Error("connect timeout"));
        }, 1000);
        ws.on("open", () => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          resolve();
        });
        ws.on("error", (error) => {
          lastError = error?.message || String(error);
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          reject(error);
        });
      });

      socket = ws;
      socket.on("message", handleMessage);
      socket.on("close", () => {
        socket = null;
        initialized = false;
        activeTurn = null;
        rejectPending(new Error("Codex app-server connection closed"));
      });
      socket.on("error", (error) => { lastError = error?.message || String(error); });
      return;
    } catch (error) {
      lastError = error?.message || String(error);
      await wait(250);
    }
  }
  throw new Error(`Could not connect to Codex app-server at ${url}`);
};

const startCodexAppServer = async () => {
  if (socket?.readyState === WebSocket.OPEN && initialized) return status();
  lastError = "";

  if (!EXTERNAL_CODEX_URL && (!child || child.killed)) {
    port = pickPort();
    child = spawn("codex", ["app-server", "--listen", appServerUrl()], {
      env: codexEnv(),
      stdio: ["ignore", "ignore", "pipe"],
    });
    child.stderr?.on("data", (chunk) => { lastError = String(chunk).trim().slice(-2000); });
    child.on("error", (error) => { lastError = error?.message || String(error); });
    child.on("exit", () => {
      child = null;
      socket = null;
      initialized = false;
      activeTurn = null;
      rejectPending(new Error("Codex app-server exited"));
    });
  }

  if (!socket || socket.readyState !== WebSocket.OPEN) await waitForSocket(appServerUrl());

  if (!initialized) {
    await callCodex("initialize", {
      clientInfo: { name: "aios", title: "AIOS", version: "0.1.0" },
      capabilities: { experimentalApi: true },
    });
    sendRaw({ jsonrpc: "2.0", method: "initialized" });
    initialized = true;
  }

  return status();
};

const stopCodexAppServer = async () => {
  try { socket?.close(); } catch {}
  try { child?.kill(); } catch {}
  socket = null;
  child = null;
  initialized = false;
  activeTurn = null;
  rejectPending(new Error("AIOS Codex bridge stopped"));
  return status();
};

const withActiveTurn = async (handler, run) => {
  if (activeTurn) throw new Error("Codex turn is already running");
  activeTurn = handler;
  try {
    return await run();
  } finally {
    if (activeTurn === handler) activeTurn = null;
  }
};

export {
  callCodex,
  startCodexAppServer,
  status as getCodexAppServerStatus,
  stopCodexAppServer,
  withActiveTurn,
};
