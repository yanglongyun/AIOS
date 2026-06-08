import { exec } from "child_process";
import path from "path";

const TIMEOUT_DEFAULT_MS = 30 * 1000;
const TIMEOUT_MIN_MS = 1000;
const TIMEOUT_MAX_MS = 5 * 60 * 1000;
const MAX_BUFFER = 4 * 1024 * 1024;
const ROOT = process.cwd();

const resolveTimeoutMs = (timeout) => {
  if (timeout == null) return TIMEOUT_DEFAULT_MS;
  const seconds = Number(timeout);
  if (!Number.isFinite(seconds)) return TIMEOUT_DEFAULT_MS;
  return Math.min(Math.max(seconds * 1000, TIMEOUT_MIN_MS), TIMEOUT_MAX_MS);
};

const resolveCwd = (cwd) => {
  const value = String(cwd || "").trim();
  if (!value) return ROOT;

  const abs = path.resolve(ROOT, value);
  const rel = path.relative(ROOT, abs);
  if (rel === ".." || rel.startsWith(`..${path.sep}`)) return ROOT;

  return abs;
};

const runShellCommand = ({ command, cwd, timeout } = {}) => new Promise((resolve) => {
  exec(String(command || ""), {
    cwd: resolveCwd(cwd),
    env: process.env,
    shell: process.env.SHELL || "/bin/sh",
    timeout: resolveTimeoutMs(timeout),
    maxBuffer: MAX_BUFFER,
  }, (error, stdout, stderr) => {
    const output = [stdout, stderr].filter(Boolean).join("");
    if (error) {
      resolve(`exit code ${error.code ?? 1}\n${output || error.message}`);
      return;
    }
    resolve(output || "(no output)");
  });
});

export { runShellCommand };
