import { readBody } from '../../../shared/http/readBody.ts';
import { json } from '../../../shared/http/json.ts';
import { create } from '../service/create.ts';
import { list } from '../service/list.ts';
import { history } from '../service/history.ts';
import { generate } from '../service/generate.ts';
import { reset } from '../service/reset.ts';

export const handleReaderApi = async (req, res, path) => {
  if (path === '/apps/reader/list' && req.method === 'GET') {
    return json(res, list());
  }

  if (path === '/apps/reader/create' && req.method === 'POST') {
    const body = await readBody(req);
    return json(res, await create(body));
  }

  if (path === '/apps/reader/history' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const sessionId = Number(url.searchParams.get('sessionId') || 0);
    const data = history({ sessionId });
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/apps/reader/generate' && req.method === 'POST') {
    const body = await readBody(req);
    const sessionId = Number(body.sessionId);
    const action = String(body.action || '').trim();
    const prompt = String(body.prompt || '').trim();
    const locale = String(body.locale || '').trim();
    const taskTitle = String(body.taskTitle || '').trim();
    const data = await generate({ sessionId, action, prompt, locale, taskTitle, req });
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/apps/reader/reset' && req.method === 'POST') {
    const body = await readBody(req);
    const data = reset(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  return false;
};
