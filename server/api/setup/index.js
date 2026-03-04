import { json } from '../utils/json.js';
import { getSetupStatus } from './status.js';

export const handleSetupApi = async (req, res, path) => {
  if (path === '/api/setup/status' && req.method === 'GET') {
    return json(res, getSetupStatus());
  }
  return json(res, { success: false, message: 'API endpoint not found' }, 404);
};
