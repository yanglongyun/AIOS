import { createServer } from 'http';
import { json } from './utils/json.js';

import { handleNotebookApi, initNotebookDatabase } from './notebook/index.js';
import { handleFinanceApi, initFinanceDatabase } from './finance/index.js';
import { handleInboxApi, initInboxDatabase } from './inbox/index.js';
import { handlePlaygroundApi, initPlaygroundDatabase } from './playground/index.js';

const APPS_PORT = 9701;

const appsServer = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  // CORS 响应头处理
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求 (Options)
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (path.startsWith('/api/apps/notebook/')) {
    const handled = await handleNotebookApi(req, res, path);
    if (handled !== false) return;
  }

  if (path.startsWith('/api/apps/finance/')) {
    const handled = await handleFinanceApi(req, res, path);
    if (handled !== false) return;
  }

  if (path.startsWith('/api/apps/inbox/') || path === '/inbox/submit') {
    const handled = await handleInboxApi(req, res, path);
    if (handled !== false) return;
  }

  if (path.startsWith('/api/apps/playground/')) {
    const handled = await handlePlaygroundApi(req, res, path);
    if (handled !== false) return;
  }

  json(res, { success: false, message: 'Apps endpoint not found' }, 404);
});

initNotebookDatabase();
initFinanceDatabase();
initInboxDatabase();
initPlaygroundDatabase();

appsServer.listen(APPS_PORT, () => {
  console.log(`  > apps: http://localhost:${APPS_PORT}`);
});
