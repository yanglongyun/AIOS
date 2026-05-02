import { WebSocketServer, WebSocket } from "ws";
import { createSession } from "../../api/chat/ws.js";
import { isAuthenticated } from "../auth/session.js";
import { redact } from "./redact.js";

const clients = new Set();

// WS 推送统一过 redact —— AI 工具调用偶尔会回显环境变量值,
// 在落到前端之前替换成 $AIOS_API_TOKEN 字面量.
const safeStringify = (msg) => redact(JSON.stringify(msg));

export const broadcast = (msg) => {
  const payload = safeStringify(msg);
  for (const ws of clients) {
    if (ws.readyState === ws.OPEN) ws.send(payload);
  }
};

const chatWss = new WebSocketServer({ noServer: true });
chatWss.on("connection", (ws) => {
  clients.add(ws);
  const send = (msg) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(safeStringify(msg));
  };
  const { handleMessage } = createSession(send);
  ws.on("message", async (raw) => {
    let data;
    try { data = JSON.parse(raw); } catch { return; }
    await handleMessage(data);
  });
  ws.on("close", () => clients.delete(ws));
});

export const setupWebSocket = (httpServer) => {
  httpServer.on("upgrade", (req, socket, head) => {
    try {
      // === 鉴权门 ===
      // WS 升级请求统一要求 cookie session 或 ?token= 兜底.
      // 失败直接断开 socket,前端会感知并提示重连/重登.
      if (!isAuthenticated(req, { allowQueryToken: true })) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      const url = new URL(req.url, `http://${req.headers.host}`);
      if (url.pathname === "/ws") {
        chatWss.handleUpgrade(req, socket, head, (ws) => {
          chatWss.emit("connection", ws, req);
        });
        return;
      }
      socket.destroy();
    } catch (err) {
      console.error("[ws-upgrade]", err);
      socket.destroy();
    }
  });
};

export { chatWss };
