import { execSync, spawn } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, "..", "..");
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
    throw new Error(`${entry} \u670D\u52A1\u9A8C\u6D3B\u5931\u8D25\uFF0C\u65E7\u670D\u52A1\u4FDD\u6301\u8FD0\u884C`);
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
  await probeProcess("apps/index.ts", 9711, "/apps/health");
  try {
    execSync("lsof -ti:9701 | xargs kill 2>/dev/null || true", { stdio: "pipe" });
  } catch {
  }
  startDetachedNode("apps/index.ts");
};
const scheduleServerRestart = async () => {
  await probeProcess("server/index.ts", 9710, "/api/health");
  setTimeout(() => {
    const child = spawn("node", ["server/index.ts"], {
      cwd: ROOT_DIR,
      detached: true,
      stdio: "ignore"
    });
    child.unref();
    process.exit(0);
  }, 300);
};
export {
  buildFrontend,
  probeProcess,
  restartAppsProcess,
  scheduleServerRestart
};
