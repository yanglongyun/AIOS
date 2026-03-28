import { execSync, spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..', '..');

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const buildFrontend = () => {
  execSync('npm run build', { cwd: ROOT_DIR, timeout: 120000, stdio: 'pipe' });
};

export const probeProcess = async (entry: string, probePort: number, healthPath: string): Promise<void> => {
  const probe = spawn('node', [entry, `--port=${probePort}`], {
    cwd: ROOT_DIR,
    detached: true,
    stdio: 'pipe'
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
    process.kill(-probe.pid!, 'SIGTERM');
  } catch {}

  try {
    execSync(`lsof -ti:${probePort} | xargs kill 2>/dev/null || true`, { stdio: 'pipe' });
  } catch {}

  if (!alive) {
    throw new Error(`${entry} 服务验活失败，旧服务保持运行`);
  }
};

const startDetachedNode = (entry: string) => {
  const child = spawn('node', [entry], {
    cwd: ROOT_DIR,
    detached: true,
    stdio: 'ignore'
  });
  child.unref();
};

export const restartAppsProcess = async () => {
  await probeProcess('apps/index.ts', 9711, '/apps/health');
  try {
    execSync('lsof -ti:9701 | xargs kill 2>/dev/null || true', { stdio: 'pipe' });
  } catch {}
  startDetachedNode('apps/index.ts');
};

export const scheduleServerRestart = async () => {
  await probeProcess('server/index.ts', 9710, '/api/health');
  setTimeout(() => {
    const child = spawn('node', ['server/index.ts'], {
      cwd: ROOT_DIR,
      detached: true,
      stdio: 'ignore'
    });
    child.unref();
    process.exit(0);
  }, 300);
};
