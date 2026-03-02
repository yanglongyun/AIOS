import { readBody } from '../app_shared/utils/readBody.js';
import { json } from '../app_shared/utils/json.js';
import {
  initCryptobotDatabase,
  initCryptobotRuntime
} from './service.js';
import { getStatusHandler } from './api/get-status.js';
import { saveConfigHandler } from './api/save-config.js';
import { startHandler } from './api/start.js';
import { stopHandler } from './api/stop.js';
import { runOnceHandler } from './api/run-once.js';
import { refreshStrategyHandler } from './api/refresh-strategy.js';
import { listTradesHandler } from './api/list-trades.js';
import { listEquityHandler } from './api/list-equity.js';
import { listLogsHandler } from './api/list-logs.js';

export { initCryptobotDatabase, initCryptobotRuntime };

export const handleCryptobotApi = async (req, res, path) => {
  if (path === '/api/apps/cryptobot/status' && req.method === 'GET') {
    return json(res, getStatusHandler());
  }

  if (path === '/api/apps/cryptobot/config' && req.method === 'POST') {
    const body = await readBody(req);
    return json(res, saveConfigHandler(body));
  }

  if (path === '/api/apps/cryptobot/start' && req.method === 'POST') {
    const body = await readBody(req);
    return json(res, startHandler(body));
  }

  if (path === '/api/apps/cryptobot/stop' && req.method === 'POST') {
    return json(res, stopHandler());
  }

  if (path === '/api/apps/cryptobot/run-once' && req.method === 'POST') {
    try {
      const data = await runOnceHandler();
      return json(res, data);
    } catch (error) {
      return json(res, { success: false, message: error.message }, 500);
    }
  }

  if (path === '/api/apps/cryptobot/refresh-strategy' && req.method === 'POST') {
    try {
      const data = await refreshStrategyHandler();
      return json(res, data);
    } catch (error) {
      return json(res, { success: false, message: error.message }, 500);
    }
  }

  if (path === '/api/apps/cryptobot/trades' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const page = Number(url.searchParams.get('page') || 1);
    const pageSize = Number(url.searchParams.get('pageSize') || 20);
    return json(res, listTradesHandler({ page, pageSize }));
  }

  if (path === '/api/apps/cryptobot/equity' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const limit = Number(url.searchParams.get('limit') || 300);
    return json(res, listEquityHandler({ limit }));
  }

  if (path === '/api/apps/cryptobot/logs' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const limit = Number(url.searchParams.get('limit') || 100);
    return json(res, listLogsHandler({ limit }));
  }

  return false;
};
