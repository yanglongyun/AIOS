import { readBody } from '../../shared/http/readBody.ts';
import { json } from '../../shared/http/json.ts';
import { listTaskRecords } from '../task/list.ts';
import { getTaskDetail } from '../task/detail.ts';
import { listTaskMessages } from '../task/messages.ts';
import { stopTask } from '../task/stop.ts';
import { createInstantTask } from '../task/create/instant.ts';
import { createAgentTask } from '../task/create/agent.ts';
import { listSchedules } from '../task/schedule/list.ts';
import { createSchedule } from '../task/schedule/create.ts';
import { updateSchedule } from '../task/schedule/update.ts';
import { deleteSchedule } from '../task/schedule/delete.ts';

const handleTaskCreateInstantApi = async (req, res, path) => {
  if (path !== '/api/task/create/instant' || req.method !== 'POST') return false;
  try {
    const {
      app,
      title = '',
      prompt,
      schema = null,
      meta = null,
      messages = null,
      tools = null,
      tool_choice = undefined,
      parallel_tool_calls = undefined,
    } = await readBody(req);
    if (!String(app || '').trim()) return json(res, { success: false, message: 'app 不能为空' }, 400);
    if (!String(prompt || '').trim() && (!Array.isArray(messages) || messages.length === 0)) {
      return json(res, { success: false, message: 'prompt/messages 不能为空' }, 400);
    }
    const result = await createInstantTask({
      app: String(app || '').trim(),
      title: String(title || '').trim(),
      prompt: String(prompt || '').trim(),
      schema,
      meta,
      messages,
      tools,
      tool_choice,
      parallel_tool_calls,
    });
    return json(res, result);
  } catch (e) {
    return json(res, { success: false, message: e?.message || '任务执行失败' }, 500);
  }
};

const handleTaskCreateAgentApi = async (req, res, path) => {
  if (path !== '/api/task/create/agent' || req.method !== 'POST') return false;
  try {
    const { app, title = '', prompt, meta = null } = await readBody(req);
    if (!String(app || '').trim()) return json(res, { success: false, message: 'app 不能为空' }, 400);
    if (!String(prompt || '').trim()) return json(res, { success: false, message: 'prompt 不能为空' }, 400);
    const result = await createAgentTask({
      app: String(app || '').trim(),
      title: String(title || '').trim(),
      prompt: String(prompt || '').trim(),
      meta
    });
    return json(res, result);
  } catch (e) {
    return json(res, { success: false, message: e?.message || '任务执行失败' }, 500);
  }
};

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
    const handled = await handleTaskCreateInstantApi(req, res, path);
    if (handled !== false) return true;
    const handled2 = await handleTaskCreateAgentApi(req, res, path);
    if (handled2 !== false) return true;
  }

  if (path === '/api/task/schedule' && req.method === 'GET') {
    const limit = Number(url.searchParams.get('limit') || 200);
    return json(res, listSchedules({ limit }));
  }

  if (path === '/api/task/schedule/create' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      return json(res, createSchedule(body));
    } catch (e) {
      return json(res, { success: false, message: e?.message || '创建计划失败' }, 400);
    }
  }

  if (path === '/api/task/schedule/update' && req.method === 'POST') {
    const body = await readBody(req);
    const id = Number(body.id || 0);
    if (!Number.isInteger(id) || id <= 0) return json(res, { success: false, message: 'id 无效' }, 400);
    const result = updateSchedule({ id, ...body });
    if (result?.status) return json(res, { success: false, message: result.message }, result.status);
    return json(res, result);
  }

  if (path === '/api/task/schedule/delete' && req.method === 'POST') {
    const body = await readBody(req);
    const id = Number(body.id || 0);
    if (!Number.isInteger(id) || id <= 0) return json(res, { success: false, message: 'id 无效' }, 400);
    const result = deleteSchedule({ id });
    if (result?.status) return json(res, { success: false, message: result.message }, result.status);
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
