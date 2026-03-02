import { readBody } from '../app_shared/utils/readBody.js';
import { json } from '../app_shared/utils/json.js';
import { initWriterpadDatabase } from './db.js';
import { getHandler } from './api/get.js';
import { syncHandler } from './api/sync.js';

export { initWriterpadDatabase };

export const handleWriterpadApi = async (req, res, path) => {
  if (path === '/apps/writerpad/get' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const data = getHandler({ id: url.searchParams.get('id') });
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/apps/writerpad/sync' && req.method === 'POST') {
    const body = await readBody(req);
    const data = syncHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  return false;
};
