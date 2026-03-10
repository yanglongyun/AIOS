import { readBody } from '../../app_shared/utils/readBody.js';
import { json } from '../../app_shared/utils/json.js';
import { initPokerDatabase } from '../repository/init.js';
import { getPokerEconomy } from '../repository/economy.js';
import { startHandler } from './start.js';
import { actionHandler } from './action.js';
import { stateHandler } from './state.js';
import { listHandler } from './list.js';

export { initPokerDatabase, getPokerEconomy };

export const handlePokerApi = async (req, res, path) => {
  if (path === '/apps/poker/status' && req.method === 'GET') {
    const economy = getPokerEconomy();
    return json(res, { success: true, economy });
  }

  if (path === '/apps/poker/start' && req.method === 'POST') {
    const data = startHandler();
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/apps/poker/action' && req.method === 'POST') {
    const body = await readBody(req);
    const data = await actionHandler(body, req);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/apps/poker/state' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const data = stateHandler({ id: url.searchParams.get('id') });
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/apps/poker/list' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    return json(res, listHandler({
      page: url.searchParams.get('page'),
      pageSize: url.searchParams.get('pageSize')
    }));
  }

  return false;
};
