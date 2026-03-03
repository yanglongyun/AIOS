import { json } from '../utils/json.js';
import { readBody } from '../utils/readBody.js';
import { listTaskRecords } from './list.js';
import { createTask } from './create.js';
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
    return json(res, { success: true, messages: listTaskMessages({ sessionId: task.session_id || '' }) });
  }

  if (path === '/api/task' && req.method === 'POST') {
    const { app, prompt } = await readBody(req);
    const result = await createTask({ app, prompt });
    return json(res, result);
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
