import { readBody } from '../../app_shared/utils/readBody.js';
import { json } from '../../app_shared/utils/json.js';
import { initReaderDatabase } from '../repository/init.js';
import { createHandler } from './create.js';
import { listHandler } from './list.js';
import { historyHandler } from './history.js';
import { generateHandler } from './generate.js';
import { resetHandler } from './reset.js';

export { initReaderDatabase };

export const handleReaderApi = async (req, res, path) => {
  if (path === '/apps/reader/list' && req.method === 'GET') {
    return json(res, listHandler());
  }

  if (path === '/apps/reader/create' && req.method === 'POST') {
    const body = await readBody(req);
    return json(res, await createHandler(body, req));
  }

  if (path === '/apps/reader/history' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const sessionId = Number(url.searchParams.get('sessionId') || 0);
    const data = historyHandler({ sessionId });
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/apps/reader/generate' && req.method === 'POST') {
    const body = await readBody(req);
    const data = await generateHandler(body, req);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/apps/reader/reset' && req.method === 'POST') {
    const body = await readBody(req);
    const data = resetHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  return false;
};
