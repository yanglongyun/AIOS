// @ts-nocheck
import { callTool } from "../service/controls/computer-use/src/tools.js";
import { toolSchemas } from "../service/controls/computer-use/src/schemas.js";
import { browserStatus, callTool as callBrowserTool } from "../ws/extension/index.js";
import { readJsonBody } from "../utils/http.js";

const now = () => new Date().toISOString();

const state = {
  browser: {
    type: "browser",
    name: "Browser",
    connected: false,
    status: "disconnected",
    endpoint: "",
    detail: "browser-use connector is not connected",
    updatedAt: "",
  },
  computer: {
    type: "computer",
    name: "Computer",
    connected: false,
    status: "disconnected",
    endpoint: "",
    detail: "computer-use connector is not connected",
    updatedAt: "",
  },
};

const normalizeType = (value) => {
  const type = String(value || "").trim();
  if (type !== "browser" && type !== "computer") return "";
  return type;
};

const readTypeFromPath = (path) => {
  const match = String(path || "").match(/^\/api\/controls\/(browser|computer)\/status$/);
  return match ? match[1] : "";
};

const computerStatus = async () => {
  try {
    const runtime = await callTool("computer_status", {});
    return {
      ...state.computer,
      connected: true,
      status: "online",
      detail: "computer-use runtime is available",
      tools: runtime.tools || [],
      drivers: runtime.drivers || {},
      updatedAt: now(),
    };
  } catch (error) {
    return {
      ...state.computer,
      connected: false,
      status: "error",
      detail: error.message || "computer-use runtime is unavailable",
      tools: Object.keys(toolSchemas),
      updatedAt: now(),
    };
  }
};

const browserState = () => {
  const s = browserStatus();
  return {
    ...state.browser,
    connected: s.connected,
    status: s.connected ? "online" : "disconnected",
    detail: s.connected ? "browser-use 扩展已连接" : "browser-use connector is not connected",
    tools: s.tools,
    connectedAt: s.connectedAt,
    updatedAt: now(),
  };
};

const publicState = async () => ({
  browser: browserState(),
  computer: await computerStatus(),
});

const updateStatus = (type, body = {}) => {
  const current = state[type];
  const connected = body.connected === undefined ? current.connected : !!body.connected;
  state[type] = {
    ...current,
    connected,
    status: String(body.status || (connected ? "online" : "disconnected")),
    endpoint: String(body.endpoint ?? current.endpoint ?? ""),
    detail: String(body.detail || (connected ? "Connected" : current.detail)),
    updatedAt: now(),
  };
  return state[type];
};

const handleControlsApi = async (req, res, { sendJson }, path, method, url) => {
  if (path === "/api/controls") {
    if (method === "GET") {
      const type = normalizeType(url.searchParams.get("type"));
      const controls = type === "computer"
        ? { computer: await computerStatus() }
        : type === "browser"
          ? { browser: browserState() }
          : await publicState();
      sendJson(res, 200, { ok: true, controls });
      return;
    }
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  const type = readTypeFromPath(path);
  if (type && method === "POST") {
    const body = await readJsonBody(req);
    const control = updateStatus(type, body);
    const controls = await publicState();
    sendJson(res, 200, { ok: true, control, controls });
    return;
  }

  if (path === "/api/controls/computer/call") {
    if (method !== "POST") {
      sendJson(res, 405, { error: "Method not allowed" });
      return;
    }
    const body = await readJsonBody(req);
    const tool = String(body.tool || body.name || "").trim();
    if (!tool || !toolSchemas[tool]) {
      sendJson(res, 400, { ok: false, error: "unknown computer-use tool", tools: Object.keys(toolSchemas) });
      return;
    }
    const result = await callTool(tool, body.args || {});
    sendJson(res, 200, { ok: true, tool, result });
    return;
  }

  if (path === "/api/controls/browser/call") {
    if (method !== "POST") {
      sendJson(res, 405, { error: "Method not allowed" });
      return;
    }
    const body = await readJsonBody(req);
    const tool = String(body.tool || body.name || "").trim();
    if (!tool) {
      sendJson(res, 400, { ok: false, error: "missing browser-use tool" });
      return;
    }
    try {
      const result = await callBrowserTool(tool, body.args || {});
      sendJson(res, 200, { ok: true, tool, result });
    } catch (error) {
      sendJson(res, 200, { ok: false, tool, error: error.message || "browser tool failed" });
    }
    return;
  }

  sendJson(res, 404, { error: "API endpoint not found" });
};

export { handleControlsApi };
