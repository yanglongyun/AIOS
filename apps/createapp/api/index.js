import { readBody } from '../../../shared/http/readBody.js';
import { json } from '../../../shared/http/json.js';

export const handleCreateAppApi = async (req, res, path) => {
  // 目前createapp主要是前端界面，后端API暂时为空
  // 实际应用创建逻辑在chat应用中完成
  if (path === '/apps/createapp/status' && req.method === 'GET') {
    return json(res, { status: 'running', message: 'CreateApp service is ready' });
  }
  
  return false; // 未匹配返回 false → 404
};
