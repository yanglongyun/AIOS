import { readBody } from '../utils/readBody.js';
import { json } from '../utils/json.js';
import { getSettings } from './get.js';
import { updateSettings } from './update.js';

export const handleSettingsApi = async (req, res, path) => {
  if (path === '/api/settings' && req.method === 'GET') {
    return json(res, getSettings());
  }

  if (path === '/api/settings' && req.method === 'POST') {
    const body = await readBody(req);
    updateSettings(body);
    return json(res, getSettings());
  }

  return json(res, { error: 'API endpoint not found' }, 404);
};
