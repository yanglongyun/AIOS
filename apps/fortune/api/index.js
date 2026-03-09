import { readBody } from '../../app_shared/utils/readBody.js';
import { json } from '../../app_shared/utils/json.js';
import { initFortuneDatabase } from '../repository/init.js';
import { divineHandler } from './divine.js';
import { listHandler } from './list.js';

export { initFortuneDatabase };

export const handleFortuneApi = async (req, res, path) => {
  if (path === '/apps/fortune/divine' && req.method === 'POST') {
    const body = await readBody(req);
    const data = await divineHandler(body, req);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/apps/fortune/list' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    return json(res, listHandler({
      page: url.searchParams.get('page'),
      pageSize: url.searchParams.get('pageSize')
    }));
  }

  return false;
};
