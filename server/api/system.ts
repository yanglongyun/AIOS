import { readBody } from '../../shared/http/readBody.ts';
import { json } from '../../shared/http/json.ts';
import { countUsers } from '../../shared/auth/repository.ts';
import { requestReload } from '../service/reload.ts';
import { execSync, spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { saveSetting } from '../repository/settings/save.ts';
import { applyLanguage } from '../system/language.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..', '..');

/** 在验活端口启动进程，health check 通过返回 true，失败返回 false。验活进程始终会被杀掉。 */
const probeProcess = async (entry: string, probePort: number, healthPath: string): Promise<boolean> => {
  const probe = spawn('node', [entry], {
    cwd: ROOT_DIR,
    detached: true,
    stdio: 'pipe',
    env: { ...process.env, PORT: String(probePort) }
  });
  probe.unref();

  const healthUrl = `http://127.0.0.1:${probePort}${healthPath}`;
  let alive = false;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const r = await fetch(healthUrl);
      if (r.ok) { alive = true; break; }
    } catch {}
  }

  // 杀掉验活进程
  try { process.kill(-probe.pid!, 'SIGTERM'); } catch {}
  try { execSync(`lsof -ti:${probePort} | xargs kill 2>/dev/null || true`, { stdio: 'pipe' }); } catch {}

  return alive;
};

/** 杀掉端口上的进程，然后启动新进程 */
const startOnPort = (entry: string) => {
  const child = spawn('node', [entry], {
    cwd: ROOT_DIR,
    detached: true,
    stdio: 'ignore',
    env: { ...process.env }
  });
  child.unref();
};

export const handleSystemApi = async (req, res, path) => {
  if (path === '/api/system/setup' && req.method === 'GET') {
    return json(res, { success: true, initialized: countUsers() > 0 });
  }

  if (path === '/api/system/reload/request' && req.method === 'POST') {
    const body = await readBody(req);
    requestReload({
      build: body.build ?? false,
      restart: body.restart || null,
      message: body.message || ''
    });
    return json(res, { success: true });
  }

  if (path === '/api/system/install/complete' && req.method === 'POST') {
    if (countUsers() === 0) {
      return json(res, { success: false, message: '系统未初始化' }, 400);
    }

    const body = await readBody(req);
    const language = body.language === 'zh' || body.language === 'en' ? body.language : '';
    if (!language) {
      return json(res, { success: false, message: '语言不合法' }, 400);
    }

    try {
      applyLanguage(language);
      saveSetting('language', language);
      execSync('npm run build', { cwd: ROOT_DIR, timeout: 120000, stdio: 'pipe' });
      return json(res, { success: true });
    } catch (e) {
      return json(res, { success: false, message: e instanceof Error ? e.message : '安装完成失败' }, 500);
    }
  }

  if (path === '/api/system/reload' && req.method === 'POST') {
    const body = await readBody(req);
    const { build, restart } = body;

    try {
      if (build) {
        execSync('npm run build', { cwd: ROOT_DIR, timeout: 120000, stdio: 'pipe' });
      }

      // apps 重启
      if (restart === 'apps' || restart === 'both') {
        const ok = await probeProcess('apps/index.ts', 9711, '/apps/health');
        if (!ok) throw new Error('apps 服务验活失败，旧服务保持运行');
        try { execSync('lsof -ti:9701 | xargs kill 2>/dev/null || true', { stdio: 'pipe' }); } catch {}
        startOnPort('apps/index.ts');
      }

      // server 重启
      if (restart === 'server' || restart === 'both') {
        const ok = await probeProcess('server/index.ts', 9710, '/api/health');
        if (!ok) throw new Error('server 服务验活失败，旧服务保持运行');
        // 先返回成功，再自杀让出端口，由新进程接管
        json(res, { success: true });
        setTimeout(() => {
          const child = spawn('sh', ['-c', 'sleep 1 && exec node server/index.ts'], {
            cwd: ROOT_DIR,
            detached: true,
            stdio: 'ignore',
            env: { ...process.env }
          });
          child.unref();
          process.exit(0);
        }, 300);
        return;
      }

      json(res, { success: true });
    } catch (e) {
      json(res, { success: false, message: e.message }, 500);
    }
    return;
  }

  json(res, { error: 'API endpoint not found' }, 404);
};
