import { readBody } from '../app_shared/utils/readBody.js';
import { json } from '../app_shared/utils/json.js';
import { initDailycheckDatabase } from './db.js';
import { todayHandler } from './api/today.js';
import { answerHandler } from './api/answer.js';
import { historyHandler } from './api/history.js';
import { ensureTodayQuestion } from './api/generate-question.js';

export { initDailycheckDatabase };

export const handleDailycheckApi = async (req, res, path) => {
  if (path === '/apps/dailycheck/today' && req.method === 'GET') {
    const data = await todayHandler();
    return json(res, data);
  }

  if (path === '/apps/dailycheck/answer' && req.method === 'POST') {
    const body = await readBody(req);
    const data = answerHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
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
    const q = await ensureTodayQuestion();
    return json(res, { success: true, id: q.id });
  }

  return false;
};
