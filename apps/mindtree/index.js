import { readBody } from '../app_shared/utils/readBody.js';
import { json } from '../app_shared/utils/json.js';
import { initMindtreeDatabase } from './db.js';
import { getHandler } from './api/get.js';
import { syncHandler } from './api/sync.js';
import { chatHandler } from './api/chat.js';

export { initMindtreeDatabase };

export const handleMindtreeApi = async (req, res, path) => {
  const isGetPath = path === '/api/apps/mindtree/get';
  const isSyncPath = path === '/api/apps/mindtree/sync';
  const isChatPath = path === '/api/apps/mindtree/chat';

  if (isGetPath && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const data = getHandler({ id: url.searchParams.get('id') });
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (isSyncPath && req.method === 'POST') {
    const body = await readBody(req);
    const data = syncHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (isChatPath && req.method === 'POST') {
    const body = await readBody(req);
    const data = await chatHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  return false;
};
