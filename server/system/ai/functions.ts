// @ts-nocheck
import { exec } from "child_process";
import { existsSync } from "fs";

const TIMEOUT_DEFAULT_MS = 30 * 1000;
const TIMEOUT_MIN_MS = 1000;
const TIMEOUT_MAX_MS = 5 * 60 * 1000;
const SHELL_CANDIDATES = [
  process.env.SHELL,
  "/bin/zsh",
  "/bin/bash",
  "/bin/sh",
  "/system/bin/sh",
];

const resolveTimeoutMs = (timeout) => {
  if (timeout == null) return TIMEOUT_DEFAULT_MS;
  const seconds = Number(timeout);
  if (!Number.isFinite(seconds)) return TIMEOUT_DEFAULT_MS;
  return Math.min(Math.max(seconds * 1000, TIMEOUT_MIN_MS), TIMEOUT_MAX_MS);
};

const resolveShell = () => {
  for (const shell of SHELL_CANDIDATES) {
    const value = String(shell || "").trim();
    if (value && existsSync(value)) return value;
  }
  return undefined;
};

const shell = ({ command, cwd, timeout } = {}) => {
  return new Promise((resolve) => {
    const options = {
      timeout: resolveTimeoutMs(timeout),
      maxBuffer: 1024 * 1024,
    };
    const shellPath = resolveShell();
    if (shellPath) options.shell = shellPath;
    if (String(cwd || "").trim()) {
      options.cwd = String(cwd || "").trim();
    }
    exec(String(command || ""), options, (error, stdout, stderr) => {
      if (error) {
        resolve(`exit code ${error.code ?? 1}\n${stderr || error.message}`);
        return;
      }
      resolve(stdout || stderr || "(no output)");
    });
  });
};

export { shell };
