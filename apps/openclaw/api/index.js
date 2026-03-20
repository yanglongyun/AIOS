import { readBody } from '../../../shared/http/readBody.js';
import { json } from '../../../shared/http/json.js';
import { getStatus } from '../service/status.js';
import { listCron, addCron, updateCron, runCron, listCronRuns, deleteCron } from '../service/cron.js';

export const handleOpenclawApi = async (req, res, path) => {
  if (path === '/apps/openclaw/status' && req.method === 'GET') {
    const data = await getStatus();
    return json(res, data);
  }

  if (path === '/apps/openclaw/cron/list' && req.method === 'GET') {
    const data = await listCron();
    if (data.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/apps/openclaw/cron/add' && req.method === 'POST') {
    const body = await readBody(req);
    const data = await addCron(body);
    if (data.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/apps/openclaw/cron/update' && req.method === 'POST') {
    const body = await readBody(req);
    const data = await updateCron(body);
    if (data.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/apps/openclaw/cron/run' && req.method === 'POST') {
    const body = await readBody(req);
    const data = await runCron(body?.jobId);
    if (data.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/apps/openclaw/cron/runs' && req.method === 'GET') {
    const url = new URL(req.url, 'http://localhost');
    const jobId = url.searchParams.get('jobId') || '';
    const limitRaw = url.searchParams.get('limit') || '20';
    const data = await listCronRuns({ jobId, limit: Number(limitRaw) });
    if (data.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/apps/openclaw/cron/delete' && req.method === 'POST') {
    const body = await readBody(req);
    const data = await deleteCron(body?.jobId);
    if (data.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  return false;
};
