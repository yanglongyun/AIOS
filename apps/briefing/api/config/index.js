import { getConfigHandler } from './get.js';
import { saveConfigHandler } from './save.js';

export const handleConfigApi = async ({ req, path, readBody }) => {
  if (path === '/apps/briefing/config/get' && req.method === 'GET') {
    return { data: getConfigHandler() };
  }

  if (path === '/apps/briefing/config/save' && req.method === 'POST') {
    const body = await readBody(req);
    return { data: saveConfigHandler(body) };
  }

  return false;
};

