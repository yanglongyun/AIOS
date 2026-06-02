import os from "node:os";
import path from "node:path";

const DEFAULT_CWD = process.env.AIOS_CODEX_DEFAULT_CWD || process.cwd();
const EXTERNAL_CODEX_URL = process.env.AIOS_CODEX_WS || "";
const REQUEST_TIMEOUT_MS = 120000;
const TURN_TIMEOUT_MS = 10 * 60 * 1000;

const enhancedPath = () => [
  path.join(os.homedir(), ".npm-global", "bin"),
  path.join(os.homedir(), ".local", "bin"),
  "/opt/homebrew/bin",
  "/usr/local/bin",
  process.env.PATH || "",
].filter(Boolean).join(":");

const codexEnv = () => ({ ...process.env, PATH: enhancedPath() });

export {
  DEFAULT_CWD,
  EXTERNAL_CODEX_URL,
  REQUEST_TIMEOUT_MS,
  TURN_TIMEOUT_MS,
  codexEnv,
  enhancedPath,
};
