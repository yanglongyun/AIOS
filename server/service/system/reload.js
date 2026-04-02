import { execSync, spawn } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { broadcast } from "../../system/ws.js";
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, "..", "..", "..");
const APPS_ENTRY = "apps/index.js";
const SERVER_ENTRY = "server/index.js";
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const buildFrontend = () => {
  execSync("npm run build", { cwd: ROOT_DIR, timeout: 12e4, stdio: "pipe" });
};
const probeProcess = async (entry, probePort, healthPath) => {
  const probe = spawn("node", [entry, `--port=${probePort}`], {
    cwd: ROOT_DIR,
    detached: true,
    stdio: "pipe"
  });
  probe.unref();
  const healthUrl = `http://127.0.0.1:${probePort}${healthPath}`;
  let alive = false;
  for (let i = 0; i < 30; i++) {
    await wait(500);
    try {
      const response = await fetch(healthUrl);
      if (response.ok) {
        alive = true;
        break;
      }
    } catch {
      continue;
    }
  }
  try {
    process.kill(-probe.pid, "SIGTERM");
  } catch {
  }
  try {
    execSync(`lsof -ti:${probePort} | xargs kill 2>/dev/null || true`, { stdio: "pipe" });
  } catch {
  }
  if (!alive) {
    throw new Error(`${entry} 服务验活失败，旧服务保持运行`);
  }
};
const startDetachedNode = (entry) => {
  const child = spawn("node", [entry], {
    cwd: ROOT_DIR,
    detached: true,
    stdio: "ignore"
  });
  child.unref();
};
const restartAppsProcess = async () => {
  await probeProcess(APPS_ENTRY, 9511, "/apps/health");
  try {
    execSync("lsof -ti:9501 | xargs kill 2>/dev/null || true", { stdio: "pipe" });
  } catch {
  }
  startDetachedNode(APPS_ENTRY);
};
const scheduleServerRestart = async () => {
  await probeProcess(SERVER_ENTRY, 9510, "/api/health");
  setTimeout(() => {
    const child = spawn("node", [SERVER_ENTRY], {
      cwd: ROOT_DIR,
      detached: true,
      stdio: "ignore"
    });
    child.unref();
    process.exit(0);
  }, 300);
};
const requestReload = (options = {}) => {
  const payload = {
    type: "reload_request",
    build: options.build ?? false,
    restartApps: options.restartApps === true,
    restartServer: options.restartServer === true,
    message: options.message || ""
  };
  console.log("[reload.broadcast]", JSON.stringify(payload));
  broadcast(payload);
};
const runReload = async (build, restartApps, restartServer, options = {}) => {
  if (build) {
    buildFrontend();
  }
  if (restartApps) {
    if (options.defer === true) {
      setTimeout(() => {
        restartAppsProcess().catch((error) => {
          console.error("[reload] apps restart failed:", error);
        });
      }, Number(options.delayMs || 300));
    } else {
      await restartAppsProcess();
    }
  }
  if (restartServer) {
    if (options.defer === true) {
      setTimeout(() => {
        scheduleServerRestart().catch((error) => {
          console.error("[reload] server restart failed:", error);
        });
      }, Number(options.delayMs || 300));
      return true;
    }
    await scheduleServerRestart();
  }
  return false;
};
export {
  buildFrontend,
  probeProcess,
  requestReload,
  restartAppsProcess,
  runReload,
  scheduleServerRestart
};
