import { readBody } from '../../shared/http/readBody.ts';
import { json } from '../../shared/http/json.ts';
import { getSettings } from '../service/settings/get.ts';
import { updateSettings } from '../service/settings/update.ts';
import { listSkills } from '../service/skills/list.ts';

export const handleSettingsApi = async (req, res, path) => {
  if (path === '/api/settings' && req.method === 'GET') {
    return json(res, getSettings());
  }

  if (path === '/api/settings/skills' && req.method === 'GET') {
    return json(res, {
      items: listSkills().map(({ content, ...skill }) => skill)
    });
  }

  if (path === '/api/settings' && req.method === 'POST') {
    const body = await readBody(req);
    updateSettings(body);
    return json(res, getSettings());
  }

  return json(res, { error: 'API endpoint not found' }, 404);
};
