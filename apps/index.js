import { createServer } from 'http';
import { existsSync, readFileSync, statSync } from 'fs';
import { extname, join, resolve } from 'path';
import { json } from './app_shared/utils/json.js';
import { appRegistry } from './registry.js';
import { getAuthUser } from '../shared/auth/guard.js';

const APPS_PORT = 9701;
const ROOT_DIR = process.cwd();
const PUBLIC_DIR = join(ROOT_DIR, 'public');
const PUBLIC_BASE = resolve(PUBLIC_DIR);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp'
};

const moduleCache = new Map();
const dbInitCache = new Set();

const loadModule = async (entry) => {
  if (moduleCache.has(entry.name)) return moduleCache.get(entry.name);
  const mod = await entry.load();
  moduleCache.set(entry.name, mod);
  return mod;
};

const initDbModule = async (entry, mod) => {
  if (dbInitCache.has(entry.name)) return;
  for (const fnName of entry.dbInit || []) {
    if (typeof mod[fnName] === 'function') {
      await mod[fnName]();
    }
  }
  dbInitCache.add(entry.name);
};

const bootServices = async () => {
  for (const entry of appRegistry) {
    if (!Array.isArray(entry.serviceStart) || entry.serviceStart.length === 0) continue;
    const mod = await loadModule(entry);
    await initDbModule(entry, mod);
    for (const fnName of entry.serviceStart) {
      if (typeof mod[fnName] === 'function') {
        await mod[fnName]();
      }
    }
  }
};

const appsServer = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (path === '/apps/health') {
      json(res, { success: true });
      return;
    }

    if (path !== '/apps/inbox/submit' && !path.startsWith('/public/')) {
      const user = getAuthUser(req);
      if (!user) {
        json(res, { success: false, message: '未登录' }, 401);
        return;
      }
    }

    if (path.startsWith('/public/')) {
      const requested = path.slice('/public/'.length);
      const filePath = resolve(PUBLIC_DIR, requested);
      if (!filePath.startsWith(PUBLIC_BASE)) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Forbidden');
        return;
      }
      if (!existsSync(filePath) || !statSync(filePath).isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not Found');
        return;
      }
      const ext = extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(readFileSync(filePath));
      return;
    }

    const entry = appRegistry.find((item) => item.match(path));
    if (!entry) {
      json(res, { success: false, message: 'Apps endpoint not found' }, 404);
      return;
    }

    const mod = await loadModule(entry);
    await initDbModule(entry, mod);

    const handle = mod[entry.apiHandler];
    if (typeof handle !== 'function') {
      json(res, { success: false, message: `Invalid app handler: ${entry.name}` }, 500);
      return;
    }

    const handled = await handle(req, res, path);
    if (handled === false) {
      json(res, { success: false, message: 'Apps endpoint not found' }, 404);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (!res.headersSent) {
      json(res, { success: false, message }, 500);
    } else {
      res.end();
    }
    console.error('[apps]', error);
  }
});

await bootServices();

appsServer.listen(APPS_PORT, () => {
  console.log(`  > apps: http://localhost:${APPS_PORT}`);
});
