import { createServer } from 'http';
import { json } from '../shared/http/json.ts';
import { appLoaders } from './registry.ts';
import { access } from '../shared/auth/index.ts';
import { hasSystemLanguage } from './app_shared/settings/language.ts';

const portArg = process.argv.find(arg => arg.startsWith('--port='));
if (portArg && !/^\-\-port=\d+$/.test(portArg)) {
  throw new Error('端口参数不合法');
}
const APPS_PORT = portArg ? Number(portArg.slice('--port='.length)) : 9701;
const APPS_HOST = '127.0.0.1';

const moduleCache = new Map();
const appModules = [];
const dbInitCache = new Set();

const loadAppModule = async (load) => {
  if (moduleCache.has(load)) return moduleCache.get(load);

  const mod = await load();
  const app = mod?.default;
  if (!app || typeof app !== 'object') {
    throw new Error('Invalid app module: missing default export object');
  }
  if (typeof app.name !== 'string' || !app.name.trim()) {
    throw new Error('Invalid app module: missing name');
  }
  if (typeof app.match !== 'function') {
    throw new Error(`Invalid app module "${app.name}": missing match(path)`);
  }
  if (typeof app.handleApi !== 'function') {
    throw new Error(`Invalid app module "${app.name}": missing handleApi(req,res,path)`);
  }

  moduleCache.set(load, app);
  return app;
};

const loadRegisteredApps = async () => {
  for (const load of appLoaders) {
    const app = await loadAppModule(load);
    appModules.push(app);
  }
};

const initDbForApp = async (app) => {
  if (dbInitCache.has(app.name)) return;
  if (typeof app.initDb === 'function') {
    await app.initDb();
  }
  dbInitCache.add(app.name);
};

const bootAppRuntimes = async () => {
  if (!hasSystemLanguage()) {
    return;
  }
  for (const app of appModules) {
    await initDbForApp(app);
    if (typeof app.initRuntime === 'function') {
      await app.initRuntime();
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

    const gate = access(req, path, req.method || 'GET', 'apps');
    if (!gate.ok) {
      json(res, { success: false, message: gate.message }, gate.status || 401);
      return;
    }
    if (!hasSystemLanguage()) {
      json(res, { success: false, message: '系统语言未完成安装，请先完成欢迎安装流程' }, 423);
      return;
    }

    const app = appModules.find((item) => item.match(path));
    if (!app) {
      json(res, { success: false, message: 'Apps endpoint not found' }, 404);
      return;
    }

    await initDbForApp(app);
    const handled = await app.handleApi(req, res, path);
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

await loadRegisteredApps();
await bootAppRuntimes();

appsServer.listen(APPS_PORT, APPS_HOST, () => {
  console.log(`  > apps: http://${APPS_HOST}:${APPS_PORT}`);
});
