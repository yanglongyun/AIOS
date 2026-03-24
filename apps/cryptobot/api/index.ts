import { readBody } from '../../../shared/http/readBody.ts';
import { json } from '../../../shared/http/json.ts';
import { getStatus } from '../service/status.ts';
import { start } from '../service/start.ts';
import { stop } from '../service/stop.ts';
import { listDecisions } from '../service/decisions.ts';
import { listEquity } from '../service/equity.ts';
import { saveGoal } from '../service/goal.ts';
import { saveExchange } from '../service/exchange.ts';
import { testExchange } from '../service/exchangeTest.ts';

export const handleCryptobotApi = async (req, res, path) => {
  if (path === '/apps/cryptobot/status' && req.method === 'GET') {
    return json(res, await getStatus());
  }

  if (path === '/apps/cryptobot/exchange' && req.method === 'POST') {
    const body = await readBody(req);
    return json(res, saveExchange(body));
  }

  if (path === '/apps/cryptobot/exchange/test' && req.method === 'POST') {
    const body = await readBody(req);
    return json(res, await testExchange(body));
  }

  if (path === '/apps/cryptobot/goal' && req.method === 'POST') {
    const body = await readBody(req);
    return json(res, saveGoal(body));
  }

  if (path === '/apps/cryptobot/start' && req.method === 'POST') {
    const body = await readBody(req);
    return json(res, await start(body));
  }

  if (path === '/apps/cryptobot/stop' && req.method === 'POST') {
    return json(res, stop());
  }

  if (path === '/apps/cryptobot/decisions' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const limit = Number(url.searchParams.get('limit') || 50);
    return json(res, listDecisions({ limit }));
  }

  if (path === '/apps/cryptobot/equity' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const limit = Number(url.searchParams.get('limit') || 300);
    return json(res, listEquity({ limit }));
  }

  return false;
};
