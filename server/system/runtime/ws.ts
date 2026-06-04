// @ts-nocheck
import { WebSocketServer } from "ws";
import {
  sendJson,
  registerClient,
  removeClient,
  subscribe,
  unsubscribe,
  stopChat,
  handleChatSend,
} from "./realtime.js";

const WS_PATH = "/api/ws";

const normalizeId = (value) => String(value || "").trim();

const bindConnection = (ws) => {
  const client = registerClient(ws);
  sendJson(ws, { type: "socket.connected", ok: true });

  ws.on("message", async (raw) => {
    let payload;
    try {
      payload = JSON.parse(String(raw || "{}"));
    } catch (error) {
      sendJson(ws, { type: "socket.error", ok: false, error: error.message });
      return;
    }

    const type = String(payload.type || "");
    if (type === "chat.subscribe") {
      subscribe(client, normalizeId(payload.conversationId));
      return;
    }
    if (type === "chat.unsubscribe") {
      unsubscribe(client, normalizeId(payload.conversationId));
      return;
    }
    if (type === "chat.stop") {
      stopChat(normalizeId(payload.conversationId));
      return;
    }
    if (type === "chat.send") {
      await handleChatSend(client, payload);
      return;
    }

    sendJson(ws, {
      type: "socket.error",
      ok: false,
      error: `unknown event type: ${type || "(empty)"}`,
    });
  });

  ws.on("close", () => {
    removeClient(client);
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

export { attachRealtimeWebSocketServer };
