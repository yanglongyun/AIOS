import { readBody } from '../utils/readBody.js';
import { json } from '../utils/json.js';
import { getSettings } from './get.js';
import { updateSettings } from './update.js';
import { listModels } from './models.js';

export const handleSettingsApi = async (req, res, path) => {
  if (path === '/api/settings' && req.method === 'GET') {
    return json(res, getSettings());
  }

  if (path === '/api/settings' && req.method === 'POST') {
    const body = await readBody(req);
    updateSettings(body);
    return json(res, getSettings());
  }

  if (path === '/api/settings/models' && req.method === 'POST') {
    const body = await readBody(req);
    const data = await listModels(body);
    return json(res, data);
  }

  return json(res, { error: 'API endpoint not found' }, 404);
};
