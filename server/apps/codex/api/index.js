import { readBody } from "../../../shared/http/readBody.js";
import { json } from "../../../shared/http/json.js";
import {
  createCodexThread,
  getCodexBridgeStatus,
  inspectCodexPanel,
  listCodexThreads,
  readCodexThread,
  runCodexTurn,
  startCodexBridge,
  stopCodexBridge,
} from "../bridge/index.js";

const handleCodexApi = async (req, res, path, url) => {
  if (path === "/apps/codex/status" && req.method === "GET") {
    return json(res, { success: true, status: getCodexBridgeStatus() });
  }

  if (path === "/apps/codex/start" && req.method === "POST") {
    return json(res, { success: true, status: await startCodexBridge() });
  }

  if (path === "/apps/codex/stop" && req.method === "POST") {
    return json(res, { success: true, status: await stopCodexBridge() });
  }

  if (path === "/apps/codex/threads" && req.method === "GET") {
    const limit = Number(url.searchParams.get("limit") || 50);
    const searchTerm = url.searchParams.get("searchTerm") || "";
    return json(res, { success: true, result: await listCodexThreads({ limit, searchTerm }) });
  }

  if (path === "/apps/codex/inspect" && req.method === "GET") {
    const panel = url.searchParams.get("panel") || "";
    const cwd = url.searchParams.get("cwd") || undefined;
    return json(res, { success: true, result: await inspectCodexPanel(panel, { cwd }) });
  }

  if (path === "/apps/codex/thread" && req.method === "POST") {
    const body = await readBody(req);
    return json(res, { success: true, thread: await createCodexThread(body || {}) });
  }

  if (path === "/apps/codex/thread" && req.method === "GET") {
    const threadId = url.searchParams.get("threadId") || "";
    if (!threadId) return json(res, { success: false, message: "threadId is required" }, 400);
    return json(res, { success: true, result: await readCodexThread(threadId) });
  }

  if (path === "/apps/codex/turn" && req.method === "POST") {
    const body = await readBody(req);
    const result = await runCodexTurn(body);
    return json(res, { success: true, result });
  }

  return json(res, { success: false, message: "Codex API endpoint not found" }, 404);
};

export { handleCodexApi };
