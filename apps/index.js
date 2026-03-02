import { createServer } from 'http';
import { json } from './app_shared/utils/json.js';

import { handleNotebookApi, initNotebookDatabase } from './notebook/index.js';
import { handleFinanceApi, initFinanceDatabase } from './finance/index.js';
import { handleInboxApi, initInboxDatabase } from './inbox/index.js';
import { handlePlaygroundApi, initPlaygroundDatabase } from './playground/index.js';
import { handleMindtreeApi, initMindtreeDatabase } from './mindtree/index.js';
import { handleWriterpadApi, initWriterpadDatabase } from './writerpad/index.js';
import { handleLovehouseApi, initLovehouseDatabase } from './lovehouse/index.js';
import { handleNokiaApi, initNokiaDatabase } from './nokia/index.js';
import { handleDebateApi, initDebateDatabase } from './debate/index.js';
import { handleTreasureApi, initTreasureDatabase } from './treasure/index.js';
import { handleBriefingApi, initBriefingDatabase } from './briefing/index.js';
import { handleLifeguideApi, initLifeguideDatabase } from './lifeguide/index.js';
import { handleCryptobotApi, initCryptobotDatabase, initCryptobotRuntime } from './cryptobot/index.js';
import { handleStoryApi, initStoryDatabase } from './story/index.js';

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

  if (path.startsWith('/api/apps/mindtree/')) {
    const handled = await handleMindtreeApi(req, res, path);
    if (handled !== false) return;
  }

  if (path.startsWith('/api/apps/writerpad/')) {
    const handled = await handleWriterpadApi(req, res, path);
    if (handled !== false) return;
  }

  if (path.startsWith('/api/apps/lovehouse/')) {
    const handled = await handleLovehouseApi(req, res, path);
    if (handled !== false) return;
  }

  if (path.startsWith('/api/apps/nokia/')) {
    const handled = await handleNokiaApi(req, res, path);
    if (handled !== false) return;
  }

  if (path.startsWith('/api/apps/debate/')) {
    const handled = await handleDebateApi(req, res, path);
    if (handled !== false) return;
  }

  if (path.startsWith('/api/apps/treasure/')) {
    const handled = await handleTreasureApi(req, res, path);
    if (handled !== false) return;
  }

  if (path.startsWith('/api/apps/briefing/')) {
    const handled = await handleBriefingApi(req, res, path);
    if (handled !== false) return;
  }

  if (path.startsWith('/api/apps/lifeguide/')) {
    const handled = await handleLifeguideApi(req, res, path);
    if (handled !== false) return;
  }

  if (path.startsWith('/api/apps/cryptobot/')) {
    const handled = await handleCryptobotApi(req, res, path);
    if (handled !== false) return;
  }

  if (path.startsWith('/api/apps/story/')) {
    const handled = await handleStoryApi(req, res, path);
    if (handled !== false) return;
  }

  json(res, { success: false, message: 'Apps endpoint not found' }, 404);
});

initNotebookDatabase();
initFinanceDatabase();
initInboxDatabase();
initPlaygroundDatabase();
initMindtreeDatabase();
initWriterpadDatabase();
initLovehouseDatabase();
initNokiaDatabase();
initDebateDatabase();
initTreasureDatabase();
initBriefingDatabase();
initLifeguideDatabase();
initCryptobotDatabase();
initStoryDatabase();
initCryptobotRuntime();

appsServer.listen(APPS_PORT, () => {
  console.log(`  > apps: http://localhost:${APPS_PORT}`);
});
