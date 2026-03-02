import { execSync, spawn } from 'child_process';
import chalk from 'chalk';
import { ROOT, API_URL, APPS_URL } from './config.js';

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

export const createSession = async () => {
  const waitReady = async (retries = 15, delay = 800) => {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(`${API_URL}/chat/create`, { method: 'POST' });
        if (res.ok) {
          const { sessionId } = await res.json();
          return sessionId;
        }
      } catch {}
      await new Promise(r => setTimeout(r, delay));
      process.stdout.write('.');
    }
    throw new Error('服务启动超时');
  };

  try {
    const res = await fetch(`${API_URL}/chat/create`, { method: 'POST' });
    if (!res.ok) throw new Error(`${res.status}`);
    const { sessionId } = await res.json();
    return sessionId;
  } catch {
    startServices();
    process.stdout.write(chalk.dim('  等待服务就绪'));
    const sessionId = await waitReady();
    console.log(chalk.dim(' 就绪\n'));
    return sessionId;
  }
};
