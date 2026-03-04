import { readBody } from '../app_shared/utils/readBody.js';
import { json } from '../app_shared/utils/json.js';
import { initRedmillDatabase } from './db.js';
import { createHandler } from './api/create.js';
import { detailHandler } from './api/detail.js';
import { updateHandler } from './api/update.js';
import { listHandler } from './api/list.js';
import { deleteHandler } from './api/delete.js';

export { initRedmillDatabase };

export const handleRedmillApi = async (req, res, path) => {
  if (path === '/apps/redmill/create' && req.method === 'POST') {
    const body = await readBody(req);
    const data = await createHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/apps/redmill/detail' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const data = detailHandler({ id: url.searchParams.get('id') });
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/apps/redmill/update' && req.method === 'POST') {
    const body = await readBody(req);
    const data = updateHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/apps/redmill/list' && req.method === 'GET') {
    return json(res, listHandler());
  }

  if (path === '/apps/redmill/delete' && req.method === 'POST') {
    const body = await readBody(req);
    const data = deleteHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  return false;
};
