import { readBody } from '../../app_shared/utils/readBody.js';
import { json } from '../../app_shared/utils/json.js';
import { initDatabase } from '../repository/init.js';
import { initRuntime } from '../runtime/index.js';
import { statusHandler } from './status.js';
import { startHandler } from './start.js';
import { stopHandler } from './stop.js';
import { decisionsHandler } from './decisions.js';
import { equityHandler } from './equity.js';
import { directiveHandler } from './directive.js';
import { exchangeHandler } from './exchange.js';
import { exchangeTestHandler } from './exchangeTest.js';

export const initCryptobotDatabase = initDatabase;
export const initCryptobotRuntime = initRuntime;

export const handleCryptobotApi = async (req, res, path) => {
  if (path === '/apps/cryptobot/status' && req.method === 'GET') {
    return json(res, await statusHandler());
  }

  if (path === '/apps/cryptobot/exchange' && req.method === 'POST') {
    const body = await readBody(req);
    return json(res, exchangeHandler(body));
  }

  if (path === '/apps/cryptobot/exchange/test' && req.method === 'POST') {
    const body = await readBody(req);
    return json(res, await exchangeTestHandler(body));
  }

  if (path === '/apps/cryptobot/directive' && req.method === 'POST') {
    const body = await readBody(req);
    return json(res, directiveHandler(body));
  }

  if (path === '/apps/cryptobot/start' && req.method === 'POST') {
    const body = await readBody(req);
    return json(res, await startHandler(body));
  }

  if (path === '/apps/cryptobot/stop' && req.method === 'POST') {
    return json(res, stopHandler());
  }

  if (path === '/apps/cryptobot/decisions' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const limit = Number(url.searchParams.get('limit') || 50);
    return json(res, decisionsHandler({ limit }));
  }

  if (path === '/apps/cryptobot/equity' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const limit = Number(url.searchParams.get('limit') || 300);
    return json(res, equityHandler({ limit }));
  }

  return false;
};
