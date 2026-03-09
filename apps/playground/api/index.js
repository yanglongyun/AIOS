import { readBody } from '../../app_shared/utils/readBody.js';
import { json } from '../../app_shared/utils/json.js';
import { initPlaygroundDatabase } from '../repository/init.js';
import { listHandler } from './list.js';
import { latestHandler } from './latest.js';
import { detailHandler } from './detail.js';
import { createHandler } from './create.js';

export { initPlaygroundDatabase };

export const handlePlaygroundApi = async (req, res, pathName) => {
  if (pathName === '/apps/playground/list' && req.method === 'GET') {
    return json(res, listHandler());
  }

  if (pathName === '/apps/playground/latest' && req.method === 'GET') {
    return json(res, latestHandler());
  }

  if (pathName === '/apps/playground/detail' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const data = detailHandler({ id: url.searchParams.get('id') });
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (pathName === '/apps/playground/create' && req.method === 'POST') {
    const body = await readBody(req);
    const data = createHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  return false;
};
