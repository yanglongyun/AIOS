import { json } from '../../app_shared/utils/json.js';
import { readBody } from '../../app_shared/utils/readBody.js';
import { todayHandler } from './today.js';
import { historyHandler } from './history.js';
import { refreshHandler } from './refresh.js';
import { answerHandler } from './answer.js';

export { initDailycheckDatabase } from '../repository/init.js';

export const handleDailycheckApi = async (req, res, path) => {
  if (path === '/apps/dailycheck/today' && req.method === 'GET') {
    const data = await todayHandler();
    return json(res, data);
  }

  if (path === '/apps/dailycheck/history' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const page = Number(url.searchParams.get('page') || 1);
    const pageSize = Number(url.searchParams.get('pageSize') || 10);
    const data = historyHandler({ page, pageSize });
    return json(res, data);
  }

  if (path === '/apps/dailycheck/refresh' && req.method === 'POST') {
    const data = await refreshHandler(req);
    return json(res, data);
  }

  if (path === '/apps/dailycheck/answer' && req.method === 'POST') {
    const body = await readBody(req);
    const data = await answerHandler(body, req);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  return false;
};
