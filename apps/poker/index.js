import { readBody } from '../app_shared/utils/readBody.js';
import { json } from '../app_shared/utils/json.js';
import { initPokerDatabase } from './db.js';
import { startHandler } from './api/start.js';
import { actionHandler } from './api/action.js';
import { stateHandler } from './api/state.js';
import { listHandler } from './api/list.js';

export { initPokerDatabase };

export const handlePokerApi = async (req, res, path) => {
  if (path === '/apps/poker/start' && req.method === 'POST') {
    return json(res, startHandler());
  }

  if (path === '/apps/poker/action' && req.method === 'POST') {
    const body = await readBody(req);
    const data = actionHandler(body);
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
