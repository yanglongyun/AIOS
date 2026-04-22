import { readBody } from "../../../shared/http/readBody.js";
import { json } from "../../../shared/http/json.js";
import { getCodexStatus } from "../service/status.js";
import { runCodex } from "../service/runCodex.js";
import {
  listSessions,
  createSession,
  deleteSession,
  getSession,
  getMessages
} from "../service/sessions.js";
import {
  getHistory,
  getAccount,
  getSettings,
  getMcp,
  getSkills,
  getMemory,
  getProjects,
  getProjectDir,
  getProjectFile
} from "../service/introspect.js";
import { saveMemoryFile, saveSettings } from "../service/editor.js";

const handleCodexApi = async (req, res, path) => {
  if (path === "/apps/codex/status" && req.method === "GET") {
    return json(res, await getCodexStatus());
  }

  // Chat
  if (path === "/apps/codex/conversations" && req.method === "GET") {
    return json(res, { items: listSessions() });
  }
  if (path === "/apps/codex/conversations/create" && req.method === "POST") {
    const body = await readBody(req);
    const result = createSession({ cwd: body.cwd });
    if (result?.error) return json(res, { error: result.error }, 400);
    return json(res, { item: result });
  }
  if (path === "/apps/codex/conversations/delete" && req.method === "POST") {
    const body = await readBody(req);
    if (!body.id) return json(res, { error: "id required" }, 400);
    const r = deleteSession(String(body.id));
    return json(res, r, r.ok ? 200 : 400);
  }
  if (path === "/apps/codex/messages" && req.method === "GET") {
    return json(res, getMessages());
  }
  if (path === "/apps/codex/send" && req.method === "POST") {
    return handleSend(req, res);
  }

  // Introspection
  if (path === "/apps/codex/history" && req.method === "GET") {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const limit = Number(url.searchParams.get("limit") || 300);
    return json(res, getHistory({ limit }));
  }
  if (path === "/apps/codex/account" && req.method === "GET") {
    return json(res, await getAccount());
  }
  if (path === "/apps/codex/settings" && req.method === "GET") {
    return json(res, getSettings());
  }
  if (path === "/apps/codex/mcp" && req.method === "GET") {
    return json(res, await getMcp());
  }
  if (path === "/apps/codex/skills" && req.method === "GET") {
    return json(res, getSkills());
  }
  if (path === "/apps/codex/memory" && req.method === "GET") {
    return json(res, getMemory());
  }
  if (path === "/apps/codex/projects" && req.method === "GET") {
    return json(res, getProjects());
  }
  if (path === "/apps/codex/projects/dir" && req.method === "GET") {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const segments = (url.searchParams.get("path") || "").split("/").filter(Boolean);
    const data = getProjectDir(segments);
    return json(res, data, data.ok ? 200 : 400);
  }
  if (path === "/apps/codex/projects/file" && req.method === "GET") {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const segments = (url.searchParams.get("path") || "").split("/").filter(Boolean);
    const data = getProjectFile(segments);
    return json(res, data, data.ok ? 200 : 400);
  }

  // Editors
  if (path === "/apps/codex/memory/save" && req.method === "POST") {
    const body = await readBody(req);
    const result = saveMemoryFile({ name: body.name, content: body.content });
    return json(res, result, result.ok ? 200 : 400);
  }
  if (path === "/apps/codex/settings/save" && req.method === "POST") {
    const body = await readBody(req);
    const result = saveSettings({ content: body.content });
    return json(res, result, result.ok ? 200 : 400);
  }

  return false;
};

const handleSend = async (req, res) => {
  const body = await readBody(req);
  const sid = String(body.conversationId || "").trim();
  const message = String(body.message || "").trim();
  if (!sid || !message) return json(res, { error: "conversationId and message required" }, 400);
  const sess = getSession(sid);
  if (!sess) return json(res, { error: "conversation not found" }, 404);

  res.writeHead(200, {
    "Content-Type": "application/x-ndjson; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    "X-Accel-Buffering": "no",
    Connection: "keep-alive"
  });
  const write = (obj) => { if (!res.writableEnded) res.write(JSON.stringify(obj) + "\n"); };

  const onEvent = (evt) => write({ type: "event", payload: evt });
  const onDone = () => { write({ type: "done" }); res.end(); };
  const onError = (err) => { write({ type: "error", message: err?.message || String(err) }); res.end(); };

  runCodex({ cwd: sess.cwd, registryDir: sess.registryDir, prompt: message, onEvent, onDone, onError });
};

export { handleCodexApi };
