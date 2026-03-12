import { readBody } from '../../../shared/http/readBody.js';
import { json } from '../../../shared/http/json.js';
import { initNokiaDatabase } from '../repository/init.js';
import { generate } from '../service/generation.js';
import { getProgress } from '../service/progress.js';

export { initNokiaDatabase };

export const handleNokiaApi = async (req, res, path) => {
  if (path === '/apps/nokia/generation' && req.method === 'POST') {
    const body = await readBody(req);
    const { history, now, choices, next } = body;
    if (!now && !next) return json(res, { success: false, message: '缺少参数' }, 400);
    let data = null;
    try {
      data = await generate({ history, now, choices, next, req });
    } catch (error) {
      data = { status: 500, message: error.message || 'generation failed' };
    }
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/apps/nokia/progress' && req.method === 'GET') {
    return json(res, getProgress());
  }

  return false;
};
