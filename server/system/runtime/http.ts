// @ts-nocheck
import http from "http";
import { createApiHandler } from "../api/index.js";
import { attachRealtimeWebSocketServer } from "../ws/index.js";

let serverInstance = null;

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(`${JSON.stringify(payload, null, 2)}\n`);
};

const readBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
};

const handleRequest = createApiHandler({
  readBody,
  sendJson,
});

const startServer = async (port = 9502) => {
  return new Promise((resolve, reject) => {
    serverInstance = http.createServer(async (req, res) => {
      try {
        await handleRequest(req, res, port);
      } catch (error) {
        sendJson(res, 500, { ok: false, error: error.message });
      }
    });
    attachRealtimeWebSocketServer(serverInstance);

    serverInstance.listen(port, "127.0.0.1", () => {
      console.log(`AGENT server running on http://127.0.0.1:${port}`);
      resolve(serverInstance);
    });

    serverInstance.on("error", reject);
  });
};

const stopServer = async () => {
  if (!serverInstance) return undefined;
  return new Promise((resolve) => {
    serverInstance.close(() => resolve());
  });
};

export { startServer, stopServer };
