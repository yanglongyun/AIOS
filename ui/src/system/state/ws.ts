import { useSyncExternalStore } from "react";

type WsHandler = (payload?: any) => void;
type WsStatus = "disconnected" | "connecting" | "connected";

const handlers = new Map<string, WsHandler[]>();
const statusListeners = new Set<() => void>();

let ws: WebSocket | null = null;
let pingTimer: number | null = null;
let pongTimer: number | null = null;
let reconnectTimer: number | null = null;
let reconnectBlocked = false;
let status: WsStatus = "disconnected";

const getWsUrl = () => {
  const url = new URL("/ws", window.location.href);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
};

const setWsStatus = (next: WsStatus) => {
  status = next;
  statusListeners.forEach((listener) => listener());
};

const emitWs = (type: string, payload?: any) => {
  handlers.get(type)?.forEach((handler) => handler(payload));
};

const clearWsTimers = () => {
  if (pingTimer) window.clearInterval(pingTimer);
  if (pongTimer) window.clearTimeout(pongTimer);
  if (reconnectTimer) window.clearTimeout(reconnectTimer);
  pingTimer = null;
  pongTimer = null;
  reconnectTimer = null;
};

const reconnectWs = (delay = 3000) => {
  if (reconnectBlocked) return;
  if (reconnectTimer) window.clearTimeout(reconnectTimer);
  reconnectTimer = window.setTimeout(() => {
    if (status === "disconnected") connectWs();
  }, delay);
};

export const connectWs = () => {
  reconnectBlocked = false;
  if (ws?.readyState === WebSocket.OPEN || ws?.readyState === WebSocket.CONNECTING) return ws;
  if (ws) {
    ws.onclose = null;
    ws.close();
  }
  clearWsTimers();
  setWsStatus("connecting");

  ws = new WebSocket(getWsUrl());
  ws.onopen = () => {
    setWsStatus("connected");
    emitWs("open");
    pingTimer = window.setInterval(() => {
      if (ws?.readyState !== WebSocket.OPEN) return;
      ws.send(JSON.stringify({ type: "ping" }));
      pongTimer = window.setTimeout(() => {
        setWsStatus("disconnected");
        ws?.close();
      }, 5000);
    }, 30000);
  };
  ws.onmessage = (event) => {
    const payload = JSON.parse(String(event.data || "{}"));
    if (payload.type === "pong") {
      if (pongTimer) window.clearTimeout(pongTimer);
      pongTimer = null;
      return;
    }
    emitWs(payload.type, payload);
  };
  ws.onclose = (event) => {
    setWsStatus("disconnected");
    clearWsTimers();
    emitWs("close");
    if (event?.code === 1008) {
      reconnectBlocked = true;
      return;
    }
    reconnectWs();
  };
  ws.onerror = () => setWsStatus("disconnected");

  return ws;
};

export const disconnectWs = () => {
  reconnectBlocked = true;
  clearWsTimers();
  if (ws) {
    ws.onclose = null;
    ws.close();
  }
  ws = null;
  setWsStatus("disconnected");
};

export const ensureWsConnected = () => {
  if (ws?.readyState === WebSocket.OPEN) return Promise.resolve();
  if (status !== "connecting") connectWs();
  return new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error("ws connection timed out")), 5000);
    const offOpen = onWs("open", () => {
      window.clearTimeout(timeout);
      offOpen();
      resolve();
    });
  });
};

export const sendWs = (payload: unknown) => {
  if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
};

export const onWs = (type: string, handler: WsHandler) => {
  if (!handlers.has(type)) handlers.set(type, []);
  handlers.get(type)!.push(handler);
  return () => {
    const list = handlers.get(type);
    if (!list) return;
    const index = list.indexOf(handler);
    if (index >= 0) list.splice(index, 1);
  };
};

export const getWsStatus = () => status;

export const useWsStatus = () =>
  useSyncExternalStore(
    (listener) => {
      statusListeners.add(listener);
      return () => statusListeners.delete(listener);
    },
    getWsStatus,
    getWsStatus,
  );

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    disconnectWs();
    handlers.clear();
    statusListeners.clear();
  });
}
