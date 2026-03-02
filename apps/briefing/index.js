import { readBody } from '../app_shared/utils/readBody.js';
import { json } from '../app_shared/utils/json.js';
import { initBriefingDatabase } from './db.js';
import { handleBriefingApi as handleBriefingApiRoute } from './api/index.js';

export { initBriefingDatabase };

export const handleBriefingApi = async (req, res, path) => {
  const result = await handleBriefingApiRoute({
    req,
    path,
    readBody,
    host: req.headers.host
  });
  if (result === false) return false;
  return json(res, result.data, result.status || 200);
};
