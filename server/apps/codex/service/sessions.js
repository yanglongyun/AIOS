import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..", "..", "..", "..");
const WORKSPACE_ROOT = path.join(ROOT_DIR, "files", "workspaces", "codex");

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const THREAD_FILE = ".aios-codex-thread";
const CWD_POINTER = ".aios-cwd";

const expandHome = (p) => {
  if (!p) return p;
  if (p === "~") return os.homedir();
  if (p.startsWith("~/")) return path.join(os.homedir(), p.slice(2));
  return p;
};

const safeStat = (p) => {
  try { return fs.statSync(p); } catch { return null; }
};

const resolveRealCwd = (sessionDir) => {
  const pointer = path.join(sessionDir, CWD_POINTER);
  try {
    if (fs.existsSync(pointer)) {
      const raw = fs.readFileSync(pointer, "utf8").trim();
      if (raw) return raw;
    }
  } catch {}
  return sessionDir;
};

// thread-id storage always in the session registry dir, not the real cwd
const sessionRegistryDir = (sessionId) => path.join(WORKSPACE_ROOT, sessionId);

const readThreadId = (cwdOrRegistry) => {
  // Accept either the real cwd (old callers) or the registry dir.
  // Prefer the registry dir where we actually write the pointer.
  const candidates = [cwdOrRegistry];
  const maybeUuid = path.basename(cwdOrRegistry);
  if (UUID_RE.test(maybeUuid)) candidates.push(cwdOrRegistry);
  for (const c of candidates) {
    try {
      const f = path.join(c, THREAD_FILE);
      if (fs.existsSync(f)) return fs.readFileSync(f, "utf8").trim();
    } catch {}
  }
  return "";
};

const writeThreadId = (sessionDirOrCwd, id) => {
  try { fs.writeFileSync(path.join(sessionDirOrCwd, THREAD_FILE), id + "\n", "utf8"); } catch {}
};

const parseSessionMeta = (sessionId, cwd, registryDir) => {
  const stat = safeStat(cwd);
  const regDir = registryDir || sessionRegistryDir(sessionId);
  const threadId = readThreadId(regDir) || readThreadId(cwd);
  return {
    sessionId,
    cwd,
    registryDir: regDir,
    threadId,
    started: Boolean(threadId),
    createdAt: stat?.birthtime?.toISOString() || stat?.mtime?.toISOString() || "",
    lastTs: stat?.mtime?.toISOString() || ""
  };
};

const listSessions = () => {
  if (!fs.existsSync(WORKSPACE_ROOT)) return [];
  const entries = fs.readdirSync(WORKSPACE_ROOT, { withFileTypes: true });
  const items = [];
  for (const e of entries) {
    if (!e.isDirectory() || !UUID_RE.test(e.name)) continue;
    const sessionDir = path.join(WORKSPACE_ROOT, e.name);
    const cwd = resolveRealCwd(sessionDir);
    items.push(parseSessionMeta(e.name, cwd, sessionDir));
  }
  items.sort((a, b) => (b.lastTs || "").localeCompare(a.lastTs || ""));
  return items;
};

const createSession = ({ cwd } = {}) => {
  const sessionId = randomUUID();
  const sessionDir = sessionRegistryDir(sessionId);
  let targetCwd;
  const trimmed = typeof cwd === "string" ? expandHome(cwd.trim()) : "";
  if (trimmed) {
    if (!path.isAbsolute(trimmed)) return { error: "cwd 必须是绝对路径" };
    targetCwd = path.resolve(trimmed);
    try {
      if (!fs.existsSync(targetCwd)) fs.mkdirSync(targetCwd, { recursive: true });
      else if (!fs.statSync(targetCwd).isDirectory()) return { error: "cwd 存在但不是目录" };
    } catch (err) {
      return { error: err?.message || "无法访问该目录" };
    }
    fs.mkdirSync(sessionDir, { recursive: true });
    fs.writeFileSync(path.join(sessionDir, CWD_POINTER), targetCwd + "\n", "utf8");
  } else {
    targetCwd = sessionDir;
    fs.mkdirSync(targetCwd, { recursive: true });
  }
  return parseSessionMeta(sessionId, targetCwd, sessionDir);
};

const deleteSession = (sessionId) => {
  if (!UUID_RE.test(sessionId)) return { ok: false, error: "invalid session id" };
  const sessionDir = sessionRegistryDir(sessionId);
  if (!sessionDir.startsWith(WORKSPACE_ROOT + path.sep)) return { ok: false, error: "path traversal" };
  try { fs.rmSync(sessionDir, { recursive: true, force: true }); } catch {}
  return { ok: true };
};

const getSession = (sessionId) => {
  if (!UUID_RE.test(sessionId)) return null;
  const sessionDir = sessionRegistryDir(sessionId);
  if (!fs.existsSync(sessionDir)) return null;
  const cwd = resolveRealCwd(sessionDir);
  return parseSessionMeta(sessionId, cwd, sessionDir);
};

// For MVP we don't reconstruct historical messages for codex — live stream only.
const getMessages = () => ({ items: [] });

export {
  listSessions,
  createSession,
  deleteSession,
  getSession,
  getMessages,
  writeThreadId,
  readThreadId
};
