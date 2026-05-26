import { DEFAULT_CWD, TURN_TIMEOUT_MS } from "./env.js";
import { normalizeCodexEvent } from "./events.js";
import { callCodex, startCodexAppServer, withActiveTurn } from "./app-server.js";

const normalizeThread = (result, cwd) => {
  if (result?.thread?.id) return result.thread;
  if (result?.id) return result;
  if (result?.threadId) return { id: result.threadId, cwd };
  return result?.thread || result || null;
};

const sandboxPolicyFromMode = (mode) => {
  if (mode === "danger-full-access") return { type: "dangerFullAccess" };
  if (mode === "workspace-write") {
    return {
      type: "workspaceWrite",
      writableRoots: [],
      networkAccess: true,
      excludeTmpdirEnvVar: false,
      excludeSlashTmp: false,
    };
  }
  return { type: "readOnly", networkAccess: false };
};

const createCodexThread = async ({
  cwd = DEFAULT_CWD,
  approvalPolicy = "never",
  sandbox = "workspace-write",
  baseInstructions = null,
} = {}) => {
  await startCodexAppServer();
  const result = await callCodex("thread/start", {
    cwd,
    approvalPolicy,
    sandbox,
    baseInstructions,
    ephemeral: false,
    experimentalRawEvents: false,
    persistExtendedHistory: false,
  });
  return normalizeThread(result, cwd);
};

const listCodexThreads = async ({ limit = 50, cwd = "", searchTerm = "" } = {}) => {
  await startCodexAppServer();
  const params = {
    limit: Math.max(1, Math.min(100, Number(limit) || 50)),
    sortKey: "updated_at",
    sortDirection: "desc",
    archived: false,
    sourceKinds: ["cli", "vscode", "exec", "appServer"],
    useStateDbOnly: true,
  };
  if (cwd) params.cwd = cwd;
  if (searchTerm) params.searchTerm = searchTerm;
  return callCodex("thread/list", params);
};

const readCodexThread = async (threadId, { includeTurns = true } = {}) => {
  await startCodexAppServer();
  return callCodex("thread/read", {
    threadId: String(threadId || ""),
    includeTurns: Boolean(includeTurns),
  });
};

const runCodexTurn = async ({
  prompt,
  threadId,
  cwd = DEFAULT_CWD,
  approvalPolicy = "never",
  sandbox = "workspace-write",
  onEvent = () => {},
} = {}) => {
  const text = String(prompt || "").trim();
  if (!text) throw new Error("prompt is required");
  await startCodexAppServer();

  const targetThread = threadId ? { id: String(threadId), cwd } : await createCodexThread({ cwd, approvalPolicy, sandbox });
  const segments = [];
  let current = "";
  let turnId = null;
  const flush = () => {
    if (current) {
      segments.push(current);
      current = "";
    }
  };

  let handler = null;
  let doneTimer = null;
  const clearDoneTimer = () => {
    if (doneTimer) clearTimeout(doneTimer);
    doneTimer = null;
  };
  const done = new Promise((resolve, reject) => {
    doneTimer = setTimeout(() => reject(new Error("Codex turn timeout")), TURN_TIMEOUT_MS);

    handler = (message) => {
      const event = normalizeCodexEvent(message);
      if (event) onEvent({ ...event, threadId: targetThread.id });

      if (message.method === "turn/started") {
        turnId = message.params?.turn?.id || null;
        return;
      }
      if (message.method === "item/agentMessage/delta") {
        current += message.params?.delta || "";
        return;
      }
      if (message.method === "turn/completed") {
        flush();
        clearDoneTimer();
        resolve({
          threadId: targetThread.id,
          turnId,
          finalText: segments.join("\n\n").trim(),
          completed: true,
        });
        return;
      }
      if (message.method === "error") {
        clearDoneTimer();
        reject(new Error(message.params?.message || "Codex error"));
        return;
      }
      flush();
    };
  });

  try {
    return await withActiveTurn(handler, async () => {
      const result = await callCodex("turn/start", {
        threadId: targetThread.id,
        input: [{ type: "text", text, text_elements: [] }],
        cwd,
        approvalPolicy,
        sandboxPolicy: sandboxPolicyFromMode(sandbox),
      });
      turnId = result?.turn?.id || turnId;
      onEvent({ type: "turn_requested", threadId: targetThread.id, turnId, raw: result });
      return done;
    });
  } catch (error) {
    clearDoneTimer();
    throw error;
  }
};

export {
  createCodexThread,
  listCodexThreads,
  readCodexThread,
  runCodexTurn,
};
