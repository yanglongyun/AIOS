import { json } from '../../shared/http/json.js';
import { listSkills } from '../service/skills/list.js';

export const handleSkillsApi = async (req, res, path) => {
  if (path === '/api/skills/list' && req.method === 'GET') {
    return json(res, { success: true, data: listSkills() });
  }
  json(res, { success: false, message: 'Not found' }, 404);
};
