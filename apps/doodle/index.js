import { readBody } from '../app_shared/utils/readBody.js';
import { json } from '../app_shared/utils/json.js';
import { initDoodleDatabase } from './db.js';
import { uploadHandler } from './api/upload.js';
import { editHandler } from './api/edit.js';
import { listHandler } from './api/list.js';
import { imageHandler } from './api/image.js';

export { initDoodleDatabase };

export const handleDoodleApi = async (req, res, path) => {
  if (path === '/apps/doodle/upload' && req.method === 'POST') {
    const body = await readBody(req);
    const data = await uploadHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/apps/doodle/edit' && req.method === 'POST') {
    const body = await readBody(req);
    const data = await editHandler(body, req);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/apps/doodle/list' && req.method === 'GET') {
    return json(res, listHandler());
  }

  if (path === '/apps/doodle/image' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    return imageHandler(res, { id: url.searchParams.get('id'), type: url.searchParams.get('type') });
  }

  return false;
};
