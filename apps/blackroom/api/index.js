import { readBody } from '../../app_shared/utils/readBody.js';
import { json } from '../../app_shared/utils/json.js';
import { initBlackroomDatabase } from '../repository/init.js';
import { listHandler } from './list.js';
import { submitHandler } from './submit.js';

export { initBlackroomDatabase };

export const handleBlackroomApi = async (req, res, path) => {
  if (path === '/apps/blackroom/list' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const page = Number(url.searchParams.get('page') || 1);
    const pageSize = Number(url.searchParams.get('pageSize') || 10);
    return json(res, listHandler({ page, pageSize }));
  }

  if (path === '/apps/blackroom/submit' && req.method === 'POST') {
    const body = await readBody(req);
    const data = await submitHandler(body, req);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  return false;
};
