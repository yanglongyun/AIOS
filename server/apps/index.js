// @ts-nocheck
// 应用服务(第二个服务,默认 :9503)。
// 加载所有已注册 app,按 app.match(path) 分发到对应 app.handleApi。
// 每个 app 自带后端 + 独立库,彼此隔离,只通过 /apps/<id>/* 契约对外。
import http from "http";
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
      throw new Error(`Invalid app module: ${mod?.default?.name || "(unknown)"}`);
    }
    if (typeof app.initDb === "function") app.initDb();
    loadedApps.push(app);
  }
  return loadedApps;
};

const handleAppsRequest = async (req, res) => {
  const url = new URL(req.url || "/", "http://127.0.0.1");
  const path = url.pathname;

  if (path === "/apps/health") {
    sendJson(res, 200, { ok: true, apps: loadedApps.map((a) => a.name) });
    return;
  }

  const app = loadedApps.find((item) => item.match(path));
  if (!app) {
    sendJson(res, 404, { ok: false, error: "app endpoint not found" });
    return;
  }

  try {
    const handled = await app.handleApi(req, res, path, url);
    if (handled === false) sendJson(res, 404, { ok: false, error: "not found" });
  } catch (error) {
    if (!res.headersSent) sendJson(res, error.statusCode || 500, { ok: false, error: error.message });
    else res.end();
  }
};

const startAppsServer = async (port = 9503) => {
  await loadApps();
  return new Promise((resolve, reject) => {
    appsServerInstance = http.createServer(handleAppsRequest);
    appsServerInstance.listen(port, "127.0.0.1", () => {
      console.log(`AGENT apps server running on http://127.0.0.1:${port}`);
      resolve(appsServerInstance);
    });
    appsServerInstance.on("error", reject);
  });
};

const stopAppsServer = async () => {
  if (!appsServerInstance) return undefined;
  return new Promise((resolve) => appsServerInstance.close(() => resolve()));
};

// 允许独立启动: node server/apps/index.js
if (process.argv[1] && process.argv[1].includes("server/apps/index.js")) {
  const port = Number(process.env.AGENT_APPS_PORT || process.env.AIOS_APPS_PORT) || 9503;
  startAppsServer(port).catch(console.error);
}

export { startAppsServer, stopAppsServer };
