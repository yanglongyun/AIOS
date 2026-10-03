// 「状态」应用的数据:机器资源、应用进程、后台任务、正在跑的对话。
import os from "node:os";
import fs from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { DATA_HOME, REPO_ROOT } from "../../system/paths.js";
import { listApps } from "../../apps/registry.js";
import { appStatus } from "../../apps/supervisor.js";
import { killProcess, listProcesses } from "../../terminals/jobs.js";
import { runningIds } from "../../chats/turn.js";
import { json, parseBody } from "./helpers.js";

const VERSION = (() => {
  try { return JSON.parse(fs.readFileSync(`${REPO_ROOT}/package.json`, "utf8")).version || ""; } catch { return ""; }
})();

const disk = (target: string) => {
  try {
    const s = fs.statfsSync(target);
    return { path: target, total: s.blocks * s.bsize, free: s.bavail * s.bsize };
  } catch { return null; }
};

// CPU 占用:两次采样之间的差值。首次请求时用开机以来的平均值兜底。
let lastSample = os.cpus().map((c) => c.times);
const cpuUsage = () => {
  const now = os.cpus().map((c) => c.times);
  let idle = 0, total = 0;
  now.forEach((t, i) => {
    const prev = lastSample[i] || { user: 0, nice: 0, sys: 0, idle: 0, irq: 0 };
    const sum = (x: typeof t) => x.user + x.nice + x.sys + x.idle + x.irq;
    idle += t.idle - prev.idle;
    total += sum(t) - sum(prev);
  });
  lastSample = now;
  return total > 0 ? 1 - idle / total : 0;
};

const status = () => ({
  aios: { version: VERSION, node: process.version, uptime: process.uptime(), dataHome: DATA_HOME, pid: process.pid },
  machine: {
    hostname: os.hostname(), platform: `${os.type()} ${os.release()}`, arch: os.arch(),
    uptime: os.uptime(), cpus: os.cpus().length, cpuModel: os.cpus()[0]?.model || "",
    cpuUsage: cpuUsage(), load: os.loadavg(),
    memory: { total: os.totalmem(), free: os.freemem() },
    disks: [disk("/"), disk(DATA_HOME)].filter(Boolean).filter((d, i, all) => all.findIndex((x) => x!.total === d!.total && x!.free === d!.free) === i),
  },
  apps: listApps().map((app) => ({ id: app.id, name: app.name, invalid: app.invalid, mode: app.run?.mode || "static", ...appStatus(app.id) })),
  processes: listProcesses(),
  runningChats: runningIds(),
});

export const handleSystemRoutes = async (req: IncomingMessage, res: ServerResponse, url: URL, method: string): Promise<boolean> => {
  const path = url.pathname;
  if (path === "/api/system/status" && method === "GET") { json(res, 200, { ok: true, ...status() }); return true; }
  if (path === "/api/system/processes/kill" && method === "POST") {
    json(res, 200, { ok: killProcess(String((await parseBody(req)).id || "")) });
    return true;
  }
  return false;
};
