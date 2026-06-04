// @ts-nocheck

import fs from "fs";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const GUI_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(GUI_DIR, "..");
const SERVER_URL = process.env.AGENT_SERVER_URL || "http://127.0.0.1:9502";
const SERVER_ENTRY = path.join(REPO_ROOT, "index.ts");
const SERVER_LOG = path.join(REPO_ROOT, "agent-server.log");
const TSX_ENTRY = path.join(REPO_ROOT, "node_modules", ".bin", "tsx");

let managedServerChild = null;

const checkServer = async () => {
  try {
    const response = await fetch(`${SERVER_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
};

const waitForServer = async (timeoutMs) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await checkServer()) return true;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return false;
};

const stopManagedServer = () => {
  if (!managedServerChild || managedServerChild.killed) return;
  try {
    managedServerChild.kill("SIGTERM");
  } catch {
    // Ignore cleanup failures during process shutdown.
  }
};

const bindCleanup = () => {
  process.on("exit", stopManagedServer);
  for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
    process.on(signal, () => {
      stopManagedServer();
      process.exitCode = signal === "SIGINT" ? 130 : 0;
      process.exit();
    });
  }
};

const ensureServer = async () => {
  if (await checkServer()) return;
  const log = fs.openSync(SERVER_LOG, "a");
  managedServerChild = spawn(TSX_ENTRY, [SERVER_ENTRY], {
    stdio: ["ignore", log, log],
    cwd: REPO_ROOT,
  });
  managedServerChild.unref();
  bindCleanup();
  process.stderr.write(`starting agent kernel (pid ${managedServerChild.pid})...\n`);
  if (!(await waitForServer(10000))) {
    throw new Error(`failed to start server, see ${SERVER_LOG}`);
  }
};

const main = async () => {
  await ensureServer();

  const child = spawn("npm", ["run", "dev"], {
    cwd: new URL(".", import.meta.url).pathname,
    stdio: "inherit",
    shell: true,
  });

  child.on("exit", (code) => {
    process.exitCode = code ?? 0;
  });
};

main().catch((error) => {
  process.stderr.write(`error: ${error.message}\n`);
  process.exitCode = 1;
});
