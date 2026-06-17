#!/usr/bin/env node
// @ts-nocheck
import http from "node:http";
import { appLoaders } from "./registry.js";
import { sendJson } from "./shared/http.js";

let appsServerInstance = null;
const loadedApps = [];

const loadApps = async () => {
  if (loadedApps.length) return loadedApps;
  for (const load of appLoaders) {
    const mod = await load();
    const app = mod?.default;
    if (!app || typeof app.match !== "function" || typeof app.handleApi !== "function") {
      throw new Error(`Invalid app module: ${app?.name || "(unknown)"}`);
    }
    if (typeof app.initDb === "function") app.initDb();
    loadedApps.push(app);
  }
  return loadedApps;
};

const handleAppsRequest = async (req, res) => {
  await loadApps();
  const url = new URL(req.url || "/", "http://127.0.0.1");
  const path = url.pathname;

  if (path === "/apps/health") {
    sendJson(res, 200, { ok: true, apps: loadedApps.map((app) => app.name) });
    return;
  }

  const app = loadedApps.find((item) => item.match(path));
  if (!app) {
    sendJson(res, 404, { ok: false, error: "app endpoint not found" });
    return;
  }

  try {
    const handled = await app.handleApi(req, res, path, url);
    if (handled === false && !res.headersSent) sendJson(res, 404, { ok: false, error: "not found" });
  } catch (error) {
    if (!res.headersSent) sendJson(res, error.statusCode || 500, { ok: false, error: error.message });
    else res.end();
  }
};

const startAppsServer = async (port = Number(process.env.AGENT_APPS_PORT || 9501)) => {
  await loadApps();
  return new Promise((resolve, reject) => {
    appsServerInstance = http.createServer(handleAppsRequest);
    appsServerInstance.listen(port, "127.0.0.1", () => {
      console.log(`Agent apps server running on http://127.0.0.1:${port}`);
      resolve(appsServerInstance);
    });
    appsServerInstance.on("error", reject);
  });
};

const stopAppsServer = async () => {
  if (!appsServerInstance) return undefined;
  return new Promise((resolve) => appsServerInstance.close(() => resolve()));
};

if (process.argv[1] && process.argv[1].includes("server/apps/index.js")) {
  startAppsServer().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export { handleAppsRequest, startAppsServer, stopAppsServer };
