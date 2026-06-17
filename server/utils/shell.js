// @ts-nocheck
import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";

const clampTimeout = (timeout) => {
  const seconds = Number(timeout || 30);
  if (!Number.isFinite(seconds)) return 30_000;
  return Math.max(1, Math.min(300, seconds)) * 1000;
};

const normalizeCwd = (cwd) => {
  const value = String(cwd || "").trim();
  if (!value) return process.cwd();
  if (value.startsWith("~")) return path.join(os.homedir(), value.slice(1));
  return path.resolve(value);
};

const runShellCommand = ({ command, cwd, timeout } = {}, { signal } = {}) => {
  const cmd = String(command || "").trim();
  if (!cmd) throw new Error("command is required");
  const workingDir = normalizeCwd(cwd);
  const timeoutMs = clampTimeout(timeout);

  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    let settled = false;
    const child = spawn(cmd, {
      cwd: workingDir,
      shell: true,
      env: process.env,
    });

    const finish = (error, code = null, timedOut = false) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener?.("abort", onAbort);
      if (error) {
        reject(error);
        return;
      }
      resolve([
        `$ ${cmd}`,
        `cwd: ${workingDir}`,
        `exit: ${code}`,
        timedOut ? "timedOut: true" : "",
        stdout ? `\nstdout:\n${stdout.trimEnd()}` : "",
        stderr ? `\nstderr:\n${stderr.trimEnd()}` : "",
      ].filter(Boolean).join("\n"));
    };

    const onAbort = () => {
      child.kill("SIGTERM");
      const error = new Error("Aborted");
      error.name = "AbortError";
      finish(error);
    };

    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      finish(null, "timeout", true);
    }, timeoutMs);

    signal?.addEventListener?.("abort", onAbort, { once: true });
    child.stdout?.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr?.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", (error) => finish(error));
    child.on("close", (code) => finish(null, code));
  });
};

export { runShellCommand };
