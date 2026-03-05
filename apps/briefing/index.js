import { readBody } from '../app_shared/utils/readBody.js';
import { json } from '../app_shared/utils/json.js';
import { initBriefingDatabase } from './db.js';
import { todayHandler } from './api/today.js';
import { historyHandler } from './api/history.js';
import { refreshHandler } from './api/refresh.js';
import { focusHandler } from './api/focus.js';

export { initBriefingDatabase };

export const handleBriefingApi = async (req, res, path) => {
  if (path === '/apps/briefing/today' && req.method === 'GET') {
    const data = todayHandler();
    return json(res, data);
  }

  if (path === '/apps/briefing/history' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const page = Number(url.searchParams.get('page') || 1);
    const pageSize = Number(url.searchParams.get('pageSize') || 10);
    const data = historyHandler({ page, pageSize });
    return json(res, data);
  }

  if (path === '/apps/briefing/focus' && req.method === 'POST') {
    const body = await readBody(req);
    const data = focusHandler(body);
    return json(res, data);
  }

  if (path === '/apps/briefing/refresh' && req.method === 'POST') {
    const body = await readBody(req);
    const data = await refreshHandler(body, req);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  return false;
};
