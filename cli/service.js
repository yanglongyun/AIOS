import { execSync, spawn } from 'child_process';
import readline from 'readline';
import chalk from 'chalk';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import path from 'path';
import { ROOT, API_URL, APPS_URL } from './config.js';

const PID_DIR = path.join(ROOT, 'files', 'tmp');
const PID_FILE = path.join(PID_DIR, 'aios-service-pids.json');

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

const killPid = (pid) => {
  const n = Number(pid);
  if (!Number.isInteger(n) || n <= 0) return false;
  if (!isPidRunning(n)) return false;

  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /PID ${n} /T /F`, { stdio: 'ignore' });
      return true;
    }

    process.kill(n, 'SIGTERM');
    return true;
  } catch {
    return false;
  }
};

export const startServices = () => {
  console.log(chalk.dim('  启动 AIOS 服务...'));
  const opts = { cwd: ROOT, detached: true, stdio: 'ignore' };
  const serverProc = spawn('node', ['server/index.js'], opts);
  const appsProc = spawn('node', ['apps/index.js'], opts);
  serverProc.unref();
  appsProc.unref();

  writePidState({
    serverPid: Number(serverProc.pid) || 0,
    appsPid: Number(appsProc.pid) || 0,
    startedAt: new Date().toISOString()
  });
};

export const stopServices = () => {
  console.log(chalk.dim('  停止 AIOS 服务...'));
  let stoppedAny = false;
  const state = readPidState();

  if (state?.serverPid) {
    if (killPid(state.serverPid)) {
      stoppedAny = true;
      console.log(chalk.dim(`  已停止: server(${state.serverPid})`));
    } else {
      console.log(chalk.dim(`  未运行: server(${state.serverPid})`));
    }
  }

  if (state?.appsPid) {
    if (killPid(state.appsPid)) {
      stoppedAny = true;
      console.log(chalk.dim(`  已停止: apps(${state.appsPid})`));
    } else {
      console.log(chalk.dim(`  未运行: apps(${state.appsPid})`));
    }
  }

  if (state?.serverPid || state?.appsPid) clearPidState();

  return stoppedAny;
};

export const isReady = async (url, method = 'GET') => {
  try {
    const res = await fetch(url, { method });
    return res.ok;
  } catch {
    return false;
  }
};

export const waitReadyUrl = async (url, method = 'GET', retries = 15, delay = 800) => {
  for (let i = 0; i < retries; i++) {
    if (await isReady(url, method)) return true;
    await new Promise(r => setTimeout(r, delay));
    process.stdout.write('.');
  }
  return false;
};

export const getServiceStatus = async () => {
  const state = readPidState() || {};
  const serverPid = Number(state.serverPid) || 0;
  const appsPid = Number(state.appsPid) || 0;
  const serverRunning = isPidRunning(serverPid);
  const appsRunning = isPidRunning(appsPid);

  if (!serverRunning && !appsRunning && (state.serverPid || state.appsPid)) {
    clearPidState();
  }

  return {
    server: {
      running: serverRunning,
      pids: serverRunning ? [serverPid] : [],
      ready: await isReady(`${API_URL}/health`)
    },
    apps: {
      running: appsRunning,
      pids: appsRunning ? [appsPid] : [],
      ready: await isReady(`${APPS_URL}/apps/health`)
    }
  };
};

let authCookie = '';

const readJsonSafe = async (res) => {
  try {
    return await res.json();
  } catch {
    return {};
  }
};

const getSetCookieHeader = (res) => {
  if (typeof res?.headers?.getSetCookie === 'function') {
    const values = res.headers.getSetCookie();
    if (Array.isArray(values) && values.length > 0) return values[0];
  }
  return res?.headers?.get?.('set-cookie') || '';
};

const pickCookiePair = (setCookie = '') => {
  const first = String(setCookie).split(';')[0].trim();
  return first || '';
};

const ask = (question) => new Promise((resolve) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question(question, (answer) => {
    rl.close();
    resolve(String(answer || '').trim());
  });
});

const login = async () => {
  let username = String(process.env.AIOS_USERNAME || '').trim();
  let password = String(process.env.AIOS_PASSWORD || '').trim();

  if (!username) username = await ask('AIOS 用户名: ');
  if (!password) password = await ask('AIOS 密码: ');

  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await readJsonSafe(res);
  if (!res.ok || data?.success === false) {
    throw new Error(data?.message || '登录失败');
  }

  const cookiePair = pickCookiePair(getSetCookieHeader(res));
  if (!cookiePair) throw new Error('登录成功但未获取会话 cookie');
  authCookie = cookiePair;
};

const ensureAuth = async () => {
  if (!authCookie) {
    await login();
    return;
  }

  const res = await fetch(`${API_URL}/auth/me`, {
    method: 'GET',
    headers: { cookie: authCookie }
  });
  if (res.ok) return;
  await login();
};

export const getAuthCookie = () => authCookie;

export const createSession = async () => {
  const waitServiceReady = async (retries = 15, delay = 800) => {
    for (let i = 0; i < retries; i++) {
      const ready = await isReady(`${API_URL}/health`);
      if (ready) return true;
      await new Promise(r => setTimeout(r, delay));
      process.stdout.write('.');
    }
    return false;
  };

  const createConversation = async () => {
    const res = await fetch(`${API_URL}/chat/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: authCookie
      },
      body: JSON.stringify({ title: 'CLI 会话' })
    });
    const data = await readJsonSafe(res);
    if (!res.ok || !data?.conversationId) {
      throw new Error(data?.error || data?.message || '创建会话失败');
    }
    return data.conversationId;
  };

  const readyNow = await isReady(`${API_URL}/health`);
  if (!readyNow) {
    startServices();
    process.stdout.write(chalk.dim('  等待服务就绪'));
    const ready = await waitServiceReady();
    if (!ready) throw new Error('服务启动超时');
    console.log(chalk.dim(' 就绪\n'));
  }

  await ensureAuth();
  return await createConversation();
};
