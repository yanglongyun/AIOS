import { readBody } from '../app_shared/utils/readBody.js';
import { json } from '../app_shared/utils/json.js';
import { initNokiaDatabase } from './db.js';
import { generationHandler } from './api/generation.js';
import { progressHandler } from './api/progress.js';

export { initNokiaDatabase };

export const handleNokiaApi = async (req, res, path) => {
  if (path === '/apps/nokia/generation' && req.method === 'POST') {
    const body = await readBody(req);
    const data = await generationHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/apps/nokia/progress' && req.method === 'GET') {
    return json(res, progressHandler());
  }

  return false;
};
