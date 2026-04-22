import { spawn } from "node:child_process";
import { writeThreadId, readThreadId } from "./sessions.js";
import { codexEnv } from "./status.js";

// Translate a codex exec --json event into the claude-shaped event our UI
// already knows how to render.
// - thread.started → remember thread_id (not emitted to UI)
// - item.completed with item.type === "agent_message" → assistant text block
// - item.completed with item.type === "command_execution" → tool_use + tool_result
// - turn.completed / turn.started / anything else → pass through as raw so the
//   UI can still show something if desired.
const translate = (evt, capture) => {
  if (!evt || typeof evt !== "object") return [];
  if (evt.type === "thread.started" && evt.thread_id) {
    capture.threadId = evt.thread_id;
    return [];
  }
  if (evt.type === "item.completed" && evt.item) {
    const item = evt.item;
    if (item.type === "agent_message" && typeof item.text === "string") {
      return [{
        type: "assistant",
        message: { content: [{ type: "text", text: item.text }] }
      }];
    }
    if (item.type === "command_execution") {
      const callId = item.id || Math.random().toString(36).slice(2);
      const out = [{
        type: "assistant",
        message: {
          content: [{
            type: "tool_use",
            id: callId,
            name: "Bash",
            input: { command: item.command || "" }
          }]
        }
      }];
      const output = item.aggregated_output || item.output || "";
      if (output) {
        out.push({
          type: "user",
          message: {
            content: [{ type: "tool_result", tool_use_id: callId, content: String(output) }]
          }
        });
      }
      return out;
    }
    if (item.type === "reasoning" || item.type === "user_message") return [];
    // Unknown item type — render its raw JSON as a collapsible tool call so
    // the user at least sees something.
    return [{
      type: "assistant",
      message: {
        content: [{
          type: "tool_use",
          id: item.id || Math.random().toString(36).slice(2),
          name: item.type || "codex.item",
          input: item
        }]
      }
    }];
  }
  return [];
};

const buildArgs = ({ threadId }) => {
  if (threadId) {
    return ["exec", "resume", threadId, "--json", "--skip-git-repo-check"];
  }
  return ["exec", "--json", "--skip-git-repo-check"];
};

const runCodex = ({ cwd, registryDir, prompt, onEvent, onDone, onError }) => {
  const threadStore = registryDir || cwd;
  const existing = readThreadId(threadStore);
  const args = buildArgs({ threadId: existing });
  const child = spawn("codex", args, {
    cwd,
    env: codexEnv(),
    shell: false
  });

  const capture = { threadId: existing };
  let stdoutBuf = "";
  let stderrBuf = "";
  let settled = false;

  const emitLine = (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    try {
      const raw = JSON.parse(trimmed);
      const translated = translate(raw, capture);
      for (const t of translated) onEvent?.(t);
    } catch {
      // ignore non-JSON lines (codex sometimes prints "Reading prompt from stdin…")
    }
  };

  child.stdout.on("data", (chunk) => {
    stdoutBuf += chunk.toString("utf8");
    let idx;
    while ((idx = stdoutBuf.indexOf("\n")) !== -1) {
      const line = stdoutBuf.slice(0, idx);
      stdoutBuf = stdoutBuf.slice(idx + 1);
      emitLine(line);
    }
  });

  child.stderr.on("data", (chunk) => {
    stderrBuf += chunk.toString("utf8");
  });

  child.on("error", (err) => {
    if (settled) return;
    settled = true;
    onError?.(err);
  });

  child.on("close", (code) => {
    if (stdoutBuf.trim()) emitLine(stdoutBuf);
    if (settled) return;
    settled = true;
    // Persist the thread id for next turn (in registry dir, not real cwd)
    if (capture.threadId) writeThreadId(threadStore, capture.threadId);
    if (code === 0) {
      onDone?.({ code, stderr: stderrBuf, threadId: capture.threadId });
    } else {
      onError?.(new Error(stderrBuf || `codex exited with code ${code}`));
    }
  });

  child.stdin.write(prompt);
  child.stdin.end();

  return child;
};

export { runCodex };
