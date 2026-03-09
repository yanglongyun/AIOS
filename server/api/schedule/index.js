import { json } from '../../../shared/http/json.js';
import { readBody } from '../../../shared/http/readBody.js';
import { listSchedules } from '../../service/schedule/list.js';
import { getScheduleDetail } from '../../service/schedule/detail.js';
import { createSchedule } from '../../service/schedule/create.js';
import { updateSchedule } from '../../service/schedule/update.js';
import { deleteSchedule } from '../../service/schedule/delete.js';

export const handleScheduleApi = async (req, res, path, url) => {
  if (path === '/api/schedule' && req.method === 'GET') {
    const limit = Number(url.searchParams.get('limit') || 50);
    return json(res, listSchedules(limit));
  }

  if (path === '/api/schedule/detail' && req.method === 'GET') {
    const id = Number(url.searchParams.get('id') || 0);
    if (!id) return json(res, { success: false, message: 'id 无效' }, 400);
    const row = getScheduleDetail(id);
    if (!row) return json(res, { success: false, message: '计划不存在' }, 404);
    return json(res, { success: true, schedule: row });
  }

  if (path === '/api/schedule/create' && req.method === 'POST') {
    const body = await readBody(req);
    if (!body.name?.trim()) return json(res, { success: false, message: 'name 不能为空' }, 400);
    if (!body.prompt?.trim()) return json(res, { success: false, message: 'prompt 不能为空' }, 400);
    return json(res, createSchedule(body));
  }

  if (path === '/api/schedule/update' && req.method === 'POST') {
    const body = await readBody(req);
    const id = Number(body.id || 0);
    if (!id) return json(res, { success: false, message: 'id 无效' }, 400);
    return json(res, updateSchedule({ id, ...body }));
  }

  if (path === '/api/schedule/delete' && req.method === 'POST') {
    const body = await readBody(req);
    const id = Number(body.id || 0);
    if (!id) return json(res, { success: false, message: 'id 无效' }, 400);
    return json(res, deleteSchedule({ id }));
  }

  json(res, { error: 'not found' }, 404);
};
