import { readBody } from '../../../shared/http/readBody.ts';
import { json } from '../../../shared/http/json.ts';
import { getToday } from '../service/today.ts';
import { getHistory } from '../service/history.ts';
import { refresh } from '../service/refresh.ts';
import { updateFocus } from '../service/focus.ts';

export const handleSubscriberApi = async (req, res, path) => {
  if (path === '/apps/subscriber/today' && req.method === 'GET') {
    const data = getToday();
    return json(res, data);
  }

  if (path === '/apps/subscriber/history' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const page = Number(url.searchParams.get('page') || 1);
    const pageSize = Number(url.searchParams.get('pageSize') || 10);
    const data = getHistory({ page, pageSize });
    return json(res, data);
  }

  if (path === '/apps/subscriber/focus' && req.method === 'POST') {
    const body = await readBody(req);
    const data = updateFocus(body);
    return json(res, data);
  }

  if (path === '/apps/subscriber/refresh' && req.method === 'POST') {
    const body = await readBody(req);
    const data = await refresh(body, req);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  return false;
};
