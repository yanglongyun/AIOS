import { readBody } from '../app_shared/utils/readBody.js';
import { json } from '../app_shared/utils/json.js';
import { initStoryDatabase } from './db.js';
import { createHandler } from './api/create.js';
import { listHandler } from './api/list.js';
import { historyHandler } from './api/history.js';
import { generateHandler } from './api/generate.js';
import { resetHandler } from './api/reset.js';

export { initStoryDatabase };

export const handleStoryApi = async (req, res, path) => {
  if (path === '/apps/story/list' && req.method === 'GET') {
    return json(res, listHandler());
  }

  if (path === '/apps/story/create' && req.method === 'POST') {
    const body = await readBody(req);
    return json(res, createHandler(body));
  }

  if (path === '/apps/story/history' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const sessionId = Number(url.searchParams.get('sessionId') || 0);
    const data = historyHandler({ sessionId });
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/apps/story/generate' && req.method === 'POST') {
    const body = await readBody(req);
    const data = await generateHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/apps/story/reset' && req.method === 'POST') {
    const body = await readBody(req);
    const data = resetHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  return false;
};
