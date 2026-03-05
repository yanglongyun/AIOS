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
    return json(res, { success: true, messages: listTaskMessages({ conversationId: task.conversation_id || '' }) });
  }

  if (path === '/api/task' && req.method === 'POST') {
    const {
      app,
      title = '',
      mode = 'agent',
      prompt,
      schema = null,
      meta = null,
      messages = null,
      tools = null,
      tool_choice = undefined,
      parallel_tool_calls = undefined,
      response_format = undefined
    } = await readBody(req);
    if (!String(app || '').trim()) return json(res, { success: false, message: 'app 不能为空' }, 400);
    if (!String(prompt || '').trim() && (!Array.isArray(messages) || messages.length === 0)) {
      return json(res, { success: false, message: 'prompt/messages 不能为空' }, 400);
    }
    if (!['instant', 'agent'].includes(String(mode || '').trim())) {
      return json(res, { success: false, message: 'mode 仅支持 instant/agent' }, 400);
    }
    const result = await createTask({
      app: String(app || '').trim(),
      title: String(title || '').trim(),
      mode: String(mode || '').trim(),
      prompt: String(prompt || '').trim(),
      schema,
      meta,
      messages,
      tools,
      tool_choice,
      parallel_tool_calls,
      response_format
    });
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
