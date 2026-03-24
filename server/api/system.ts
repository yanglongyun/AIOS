import { readBody } from '../../shared/http/readBody.ts';
import { json } from '../../shared/http/json.ts';
import { countUsers } from '../../shared/auth/repository.ts';
import { requestReload } from '../service/reload.ts';
import { execSync, spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..', '..');

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

  if (path === '/api/system/reload' && req.method === 'POST') {
    const body = await readBody(req);
    const { build, restart } = body;

    try {
      if (build) {
        execSync('npm run build', { cwd: ROOT_DIR, timeout: 120000, stdio: 'pipe' });
      }

      if (restart === 'apps' || restart === 'both') {
        try {
          execSync('lsof -ti:9701 | xargs kill 2>/dev/null || true', { cwd: ROOT_DIR, stdio: 'pipe' });
        } catch {}
        const appsChild = spawn('node', ['apps/index.ts'], {
          cwd: ROOT_DIR,
          detached: true,
          stdio: 'ignore',
          env: { ...process.env }
        });
        appsChild.unref();
      }

      json(res, { success: true });

      if (restart === 'server' || restart === 'both') {
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
      }
    } catch (e) {
      json(res, { success: false, message: e.message }, 500);
    }
    return;
  }

  json(res, { error: 'API endpoint not found' }, 404);
};

