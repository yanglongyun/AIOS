import { readBody } from '../app_shared/utils/readBody.js';
import { json } from '../app_shared/utils/json.js';
import { initDatabase } from './db.js';
import { initRuntime } from './runtime/index.js';
import { getStatusHandler } from './api/get/status.js';
import { saveExchangeHandler } from './api/save/exchange.js';
import { testExchangeHandler } from './api/test/exchange.js';
import { saveDirectiveHandler } from './api/save/directive.js';
import { startHandler } from './api/start.js';
import { stopHandler } from './api/stop.js';
import { listDecisionsHandler } from './api/list/decisions.js';
import { listEquityHandler } from './api/list/equity.js';

export const initCryptobotDatabase = initDatabase;
export const initCryptobotRuntime = initRuntime;

export const handleCryptobotApi = async (req, res, path) => {
  if (path === '/apps/cryptobot/status' && req.method === 'GET') {
    return json(res, getStatusHandler());
  }

  if (path === '/apps/cryptobot/exchange' && req.method === 'POST') {
    const body = await readBody(req);
    return json(res, saveExchangeHandler(body));
  }

  if (path === '/apps/cryptobot/exchange/test' && req.method === 'POST') {
    const body = await readBody(req);
    return json(res, await testExchangeHandler(body));
  }

  if (path === '/apps/cryptobot/directive' && req.method === 'POST') {
    const body = await readBody(req);
    return json(res, saveDirectiveHandler(body));
  }

  if (path === '/apps/cryptobot/start' && req.method === 'POST') {
    const body = await readBody(req);
    return json(res, startHandler(body));
  }

  if (path === '/apps/cryptobot/stop' && req.method === 'POST') {
    return json(res, stopHandler());
  }

  if (path === '/apps/cryptobot/decisions' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const limit = Number(url.searchParams.get('limit') || 50);
    return json(res, listDecisionsHandler({ limit }));
  }

  if (path === '/apps/cryptobot/equity' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const limit = Number(url.searchParams.get('limit') || 300);
    return json(res, listEquityHandler({ limit }));
  }

  return false;
};
