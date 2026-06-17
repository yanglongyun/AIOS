#!/usr/bin/env node
// @ts-nocheck
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createApiHandler } from "./api/index.js";
import { initDb } from "./repository/db.js";
import { proxyApps } from "./runtime/appsProxy.js";
import { sendJson, sendStatic } from "./utils/http.js";
import { attachRealtimeWebSocketServer } from "./ws/index.js";

const port = Number(process.env.AGENT_PORT || 9500);
const root = process.cwd();
const distRoot = path.join(root, "dist");
const staticRoot = fs.existsSync(distRoot) ? distRoot : root;
const handleApi = createApiHandler({ sendJson });

initDb();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);
  if (url.pathname === "/ws") {
    sendJson(res, 426, { error: "WebSocket upgrade required" });
    return;
  }
  if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
    await handleApi(req, res);
    return;
  }
  if (url.pathname === "/apps" || url.pathname.startsWith("/apps/")) {
    await proxyApps(req, res);
    return;
  }
  await sendStatic(req, res, staticRoot);
});

attachRealtimeWebSocketServer(server);

server.listen(port, "127.0.0.1", () => {
  console.log(`Agent Chat server running on http://127.0.0.1:${port}`);
});
