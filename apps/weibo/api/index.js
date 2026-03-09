import fs from 'fs';
import path from 'path';
import { json } from '../../app_shared/utils/json.js';
import { readBody } from '../../app_shared/utils/readBody.js';
import { initWeiboDatabase } from '../repository/init.js';
import { listHandler } from './list.js';
import { createHandler } from './create.js';
import { deleteHandler } from './delete.js';
import { getProfileHandler } from './profileGet.js';
import { saveProfileHandler } from './profileSave.js';

export { initWeiboDatabase };

export const handleWeiboApi = async (req, res, pathName) => {
  if (pathName === '/apps/weibo/feed' && req.method === 'GET') {
    const html = fs.readFileSync(path.join(process.cwd(), 'public', 'apps', 'weibo', 'feed.html'), 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return true;
  }

  if (pathName === '/apps/weibo/list' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    return json(res, listHandler({ limit: Number(url.searchParams.get('limit') || 50) }));
  }

  if (pathName === '/apps/weibo/profile' && req.method === 'GET') {
    return json(res, getProfileHandler());
  }

  if (pathName === '/apps/weibo/profile/save' && req.method === 'POST') {
    const body = await readBody(req);
    const data = saveProfileHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (pathName === '/apps/weibo/create' && req.method === 'POST') {
    const body = await readBody(req);
    const data = createHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (pathName === '/apps/weibo/delete' && req.method === 'POST') {
    const body = await readBody(req);
    const data = deleteHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  return false;
};
