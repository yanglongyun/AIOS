// @ts-nocheck
import { handleChatApi } from "./chat/index.js";
import { handleHealthApi } from "./health/index.js";
import { handleFsApi } from "./fs/index.js";
import { handleSettingsApi } from "./settings/index.js";
import { handleTasksApi } from "./tasks/index.js";
import { handleDebugApi } from "./debug/index.js";
import { serveGui } from "../runtime/static.js";
import { proxyApps } from "../runtime/apps.js";

const ROUTES = [
  { prefix: "/api/chat", handler: handleChatApi },
  { prefix: "/api/fs", handler: handleFsApi },
  { prefix: "/api/settings", handler: handleSettingsApi },
  { prefix: "/api/tasks", handler: handleTasksApi },
  { prefix: "/api/debug", handler: handleDebugApi },
];

const handleApiRequest = async (req, res, deps, context = {}) => {
  const { sendJson } = deps;
  const url = new URL(req.url || "/", "http://127.0.0.1");
  const path = url.pathname;
  const method = req.method;

  try {
    if (path === "/api/health") {
      return handleHealthApi(req, res, deps, path, method, url, context);
    }
    // /apps/* 转发到应用服务(生产模式;开发模式由 Vite 代理)
    if (path === "/apps" || path.startsWith("/apps/")) {
      return proxyApps(req, res);
    }
    for (const route of ROUTES) {
      if (path === route.prefix || path.startsWith(`${route.prefix}/`)) {
        return route.handler(req, res, deps, path, method, url, context);
      }
    }
    // 未匹配的 /api 路径返回 JSON 404;其余路径交给 UI 静态服务(SPA)
    if (path === "/api" || path.startsWith("/api/")) {
      sendJson(res, 404, { ok: false, error: "Not found" });
      return;
    }
    return serveGui(req, res, path);
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message });
  }
};

const createApiHandler = (deps) => async (req, res, port) =>
  handleApiRequest(req, res, deps, { port });

export { createApiHandler, handleApiRequest };
