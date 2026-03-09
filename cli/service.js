import { execSync, spawn } from 'child_process';
import readline from 'readline';
import chalk from 'chalk';
import { ROOT, API_URL, APPS_URL } from './config.js';

export const buildUI = () => {
  try {
    execSync('npm run build', { cwd: ROOT, stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
};

export const startServices = () => {
  console.log(chalk.dim('  启动 AIOS 服务...'));
  const opts = { cwd: ROOT, detached: true, stdio: 'ignore' };
  spawn('node', ['server/index.js'], opts).unref();
  spawn('node', ['apps/index.js'], opts).unref();
};

export const stopServices = () => {
  console.log(chalk.dim('  停止 AIOS 服务...'));
  const patterns = ['node server/index.js', 'node apps/index.js'];
  let stoppedAny = false;

  for (const pattern of patterns) {
    try {
      execSync(`pkill -f "${pattern}"`, { stdio: 'ignore' });
      stoppedAny = true;
      console.log(chalk.dim(`  已停止: ${pattern}`));
    } catch {
      console.log(chalk.dim(`  未运行: ${pattern}`));
    }
  }

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

const findPids = (pattern) => {
  try {
    const out = execSync(`pgrep -f "${pattern}"`, { encoding: 'utf8' }).trim();
    if (!out) return [];
    return out.split('\n').map((line) => Number(line.trim())).filter((n) => Number.isInteger(n) && n > 0);
  } catch {
    return [];
  }
};

export const getServiceStatus = async () => {
  const serverPattern = 'node server/index.js';
  const appsPattern = 'node apps/index.js';
  const serverPids = findPids(serverPattern);
  const appsPids = findPids(appsPattern);

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

  const createConversationLocally = async () => {
    const mod = await import('../server/chat/conversations.js');
    const data = mod.createConversation('CLI 会话');
    if (data?.conversationId) return data.conversationId;
    throw new Error('创建会话失败');
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
  return await createConversationLocally();
};
