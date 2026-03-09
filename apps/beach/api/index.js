import { readBody } from '../../app_shared/utils/readBody.js';
import { json } from '../../app_shared/utils/json.js';
import { initBeachDatabase } from '../repository/init.js';
import { interactHandler } from './interact.js';

export { initBeachDatabase };

export const handleBeachApi = async (req, res, path) => {
  if (path === '/apps/beach/interact' && req.method === 'POST') {
    const body = await readBody(req);
    const data = await interactHandler(body, req);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }
  return false;
};
