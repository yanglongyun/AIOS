import { readBody } from '../app_shared/utils/readBody.js';
import { json } from '../app_shared/utils/json.js';
import { initTreasureDatabase } from './db.js';
import { uploadHandler } from './api/upload.js';
import { appraiseHandler } from './api/appraise.js';
import { listHandler } from './api/list.js';
import { detailHandler } from './api/detail.js';
import { deleteHandler } from './api/delete.js';
import { imageHandler } from './api/image.js';

export { initTreasureDatabase };

export const handleTreasureApi = async (req, res, path) => {
  if (path === '/api/apps/treasure/upload' && req.method === 'POST') {
    const body = await readBody(req);
    const data = await uploadHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/api/apps/treasure/appraise' && req.method === 'POST') {
    const body = await readBody(req);
    const data = await appraiseHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/api/apps/treasure/list' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    return json(res, listHandler({
      page: url.searchParams.get('page'),
      pageSize: url.searchParams.get('pageSize')
    }));
  }

  if (path === '/api/apps/treasure/detail' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const data = detailHandler({ id: url.searchParams.get('id') });
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/api/apps/treasure/image' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    return imageHandler(res, { id: url.searchParams.get('id') });
  }

  if (path === '/api/apps/treasure/delete' && req.method === 'POST') {
    const body = await readBody(req);
    const data = deleteHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  return false;
};
