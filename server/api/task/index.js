import { json } from '../../../shared/http/json.js';
import { readBody } from '../../../shared/http/readBody.js';
import { listTaskRecords } from './list.js';
import { handleTaskCreateApi } from './create/index.js';
import { getTaskDetail } from './detail.js';
import { listTaskMessages } from './messages.js';
import { stopTask } from './stop.js';

export const handleTaskApi = async (req, res, path, url) => {
  if (path === '/api/task' && req.method === 'GET') {
    const limit = Number(url.searchParams.get('limit') || 20);
    return json(res, listTaskRecords({ limit }));
  }

  if (path === '/api/task/detail' && req.method === 'GET') {
    const id = Number(url.searchParams.get('id') || 0);
    if (!Number.isInteger(id) || id <= 0) return json(res, { success: false, message: 'id 无效' }, 400);
    const task = getTaskDetail({ id });
    if (!task) return json(res, { success: false, message: '任务不存在' }, 404);
    return json(res, { success: true, task });
  }

  if (path === '/api/task/messages' && req.method === 'GET') {
    const id = Number(url.searchParams.get('id') || 0);
    if (!Number.isInteger(id) || id <= 0) return json(res, { success: false, message: 'id 无效' }, 400);
    const task = getTaskDetail({ id });
    if (!task) return json(res, { success: false, message: '任务不存在' }, 404);
    return json(res, { success: true, messages: listTaskMessages({ conversationId: task.conversation_id || '' }) });
  }

  if (path.startsWith('/api/task/create')) {
    const handled = await handleTaskCreateApi(req, res, path);
    if (handled !== false) return true;
  }

  if (path === '/api/task/stop' && req.method === 'POST') {
    const body = await readBody(req);
    const id = Number(body.id || 0);
    if (!Number.isInteger(id) || id <= 0) return json(res, { success: false, message: 'id 无效' }, 400);
    const result = stopTask({ id });
    if (result?.status) return json(res, { success: false, message: result.message }, result.status);
    return json(res, result);
  }

  json(res, { error: 'not found' }, 404);
};
