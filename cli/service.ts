import { execSync, spawn } from 'child_process';
import type { SpawnOptions } from 'child_process';
import chalk from 'chalk';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import path from 'path';
import { ROOT, SERVER_PORT, APPS_PORT, API_URL, APPS_URL } from './config.ts';
import { ensureAuth, getAuthCookie } from './auth.ts';
import t from './locale.ts';
import { createSpinner } from './ui.ts';

const PID_DIR = path.join(ROOT, 'files', 'tmp');
const PID_FILE = path.join(PID_DIR, 'aios-service-pids.json');

export { getAuthCookie };

export const buildUI = () => {
  try {
    execSync('npm run build', { cwd: ROOT, stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
};

const ensurePidDir = () => {
  if (!existsSync(PID_DIR)) mkdirSync(PID_DIR, { recursive: true });
};

const readPidState = () => {
  try {
    if (!existsSync(PID_FILE)) return null;
    const raw = readFileSync(PID_FILE, 'utf8');
    const data = JSON.parse(raw);
    return data && typeof data === 'object' ? data : null;
  } catch {
    return null;
  }
};

const writePidState = (state) => {
  try {
    ensurePidDir();
    writeFileSync(PID_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch {}
};

const clearPidState = () => {
  try {
    if (existsSync(PID_FILE)) unlinkSync(PID_FILE);
  } catch {}
};

const isPidRunning = (pid) => {
  const n = Number(pid);
  if (!Number.isInteger(n) || n <= 0) return false;
  try {
    process.kill(n, 0);
    return true;
  } catch {
    return false;
  }
};

const sleepMs = (ms) => {
  const buf = new SharedArrayBuffer(4);
  const view = new Int32Array(buf);
  Atomics.wait(view, 0, 0, Math.max(0, Number(ms) || 0));
};

const listListeningPids = (port) => {
  const n = Number(port);
  if (!Number.isInteger(n) || n <= 0) return [];
  try {
    const output = execSync(`lsof -nP -t -iTCP:${n} -sTCP:LISTEN`, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString('utf8')
      .trim();
    if (!output) return [];
    return [...new Set(
      output
        .split('\n')
        .map((line) => Number(line.trim()))
        .filter((pid) => Number.isInteger(pid) && pid > 0)
    )];
  } catch {
    return [];
  }
};

const killPid = (pid) => {
  const n = Number(pid);
  if (!Number.isInteger(n) || n <= 0) return false;
  if (n === process.pid) return false;
  if (!isPidRunning(n)) return false;

  try {
    try { process.kill(-n, 'SIGTERM'); } catch {}
    try { process.kill(n, 'SIGTERM'); } catch {}
    sleepMs(120);
    if (isPidRunning(n)) {
      try { process.kill(-n, 'SIGKILL'); } catch {}
      try { process.kill(n, 'SIGKILL'); } catch {}
    }
    return true;
  } catch {
    return false;
  }
};

export const startServices = () => {
  console.log(chalk.dim('  ' + t.starting));
  const opts: SpawnOptions = { cwd: ROOT, detached: true, stdio: 'ignore' };
  const serverProc = spawn(process.execPath, ['--import', 'tsx', 'server/index.ts'], opts);
  const appsProc = spawn(process.execPath, ['--import', 'tsx', 'apps/index.ts'], opts);
  serverProc.unref();
  appsProc.unref();

  writePidState({
    serverPid: Number(serverProc.pid) || 0,
    appsPid: Number(appsProc.pid) || 0,
    startedAt: new Date().toISOString()
  });
};

export const stopServices = () => {
  console.log(chalk.dim('  ' + t.stopping));
  let stoppedAny = false;
  const state = readPidState();
  const targets = new Map();
  if (state?.serverPid) targets.set(Number(state.serverPid), `server(${state.serverPid})`);
  if (state?.appsPid) targets.set(Number(state.appsPid), `apps(${state.appsPid})`);
  for (const pid of listListeningPids(SERVER_PORT)) {
    if (!targets.has(pid)) targets.set(pid, `port:${SERVER_PORT}(${pid})`);
  }
  for (const pid of listListeningPids(APPS_PORT)) {
    if (!targets.has(pid)) targets.set(pid, `port:${APPS_PORT}(${pid})`);
  }

  for (const [pid, label] of targets.entries()) {
    if (killPid(pid)) {
      stoppedAny = true;
      console.log(chalk.dim('  ' + t.stopped(label)));
    } else {
      console.log(chalk.dim('  ' + t.notRunning(label)));
    }
  }

  if (state?.serverPid || state?.appsPid) clearPidState();

  const remains9700 = listListeningPids(SERVER_PORT);
  const remains9701 = listListeningPids(APPS_PORT);
  if (remains9700.length > 0) {
    console.log(chalk.yellow('  ' + t.portOccupied(SERVER_PORT, remains9700.join(', '))));
  }
  if (remains9701.length > 0) {
    console.log(chalk.yellow('  ' + t.portOccupied(APPS_PORT, remains9701.join(', '))));
  }

  return stoppedAny;
};

export const isReady = async (url) => {
  try {
    const res = await fetch(url, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
};

export const waitReadyUrl = async (url, retries = 15, delay = 800) => {
  for (let i = 0; i < retries; i++) {
    if (await isReady(url)) return true;
    await new Promise(r => setTimeout(r, delay));
  }
  return false;
};

export const getServiceStatus = async () => {
  const state = readPidState() || {};
  const serverPid = Number(state.serverPid) || 0;
  const appsPid = Number(state.appsPid) || 0;
  const serverRunning = isPidRunning(serverPid);
  const appsRunning = isPidRunning(appsPid);
  const serverPortPids = listListeningPids(SERVER_PORT);
  const appsPortPids = listListeningPids(APPS_PORT);
  const serverPids = serverPortPids.length > 0 ? serverPortPids : (serverRunning ? [serverPid] : []);
  const appsPids = appsPortPids.length > 0 ? appsPortPids : (appsRunning ? [appsPid] : []);

  if (serverPids.length === 0 && appsPids.length === 0 && (state.serverPid || state.appsPid)) {
    clearPidState();
  }

  return {
    server: {
      running: serverPids.length > 0,
      pids: serverPids,
      ready: await isReady(`${API_URL}/health`)
    },
    apps: {
      running: appsPids.length > 0,
      pids: appsPids,
      ready: await isReady(`${APPS_URL}/apps/health`)
    }
  };
};

const readJsonSafe = async (res) => {
  try { return await res.json(); } catch { return {}; }
};

export const createSession = async () => {
  const readyNow = await isReady(`${API_URL}/health`);
  if (!readyNow) {
    startServices();
    const spinner = createSpinner(t.waitingReady);
    spinner.start();
    const ready = await waitReadyUrl(`${API_URL}/health`);
    if (!ready) {
      spinner.fail(t.startTimeout);
      throw new Error(t.startTimeout);
    }
    spinner.stop(t.ready);
  }

  await ensureAuth();

  const res = await fetch(`${API_URL}/chat/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: getAuthCookie()
    },
    body: JSON.stringify({ title: 'CLI' })
  });
  const data = await readJsonSafe(res);
  if (!res.ok || !data?.conversationId) {
    throw new Error(data?.error || data?.message || t.chatCreateFailed);
  }
  return data.conversationId;
};
