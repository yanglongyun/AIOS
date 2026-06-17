// @ts-nocheck
import WebSocket, { WebSocketServer } from "ws";
import { dispatchWebSocketEvent } from "./dispatch.js";
import { bindExtension } from "./extension/index.js";

const WS_PATH = "/ws";
const clients = new Set();

const sendJson = (ws, payload) => {
  if (ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify(payload));
};

const broadcastWebSocketEvent = (payload) => {
  for (const client of clients) {
    sendJson(client.ws, payload);
  }
};

const bindConnection = (ws, req) => {
  const url = new URL(req?.url || "/", "http://127.0.0.1");
  if (url.searchParams.get("client") === "extension") {
    bindExtension(ws);
    return;
  }
  const client = { ws };
  clients.add(client);
  const emit = (payload) => sendJson(ws, payload);
  emit({ type: "socket.connected" });

  ws.on("message", async (raw) => {
    let payload;
    try {
      payload = JSON.parse(String(raw || "{}"));
    } catch (error) {
      emit({ type: "socket.error", content: error.message });
      return;
    }
    try {
      await dispatchWebSocketEvent({ ws, client, emit }, payload);
    } catch (error) {
      emit({ type: "socket.error", content: error.message });
    }
  });

  ws.on("close", () => {
    clients.delete(client);
  });
};

const attachRealtimeWebSocketServer = (server) => {
  const wss = new WebSocketServer({ noServer: true });
  wss.on("connection", bindConnection);
  server.on("upgrade", (req, socket, head) => {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    if (url.pathname !== WS_PATH) {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  });
  return wss;
};

export { attachRealtimeWebSocketServer, broadcastWebSocketEvent };
