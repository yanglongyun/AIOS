import { readBody } from '../app_shared/utils/readBody.js';
import { json } from '../app_shared/utils/json.js';
import { initBriefingDatabase } from './db.js';
import { getConfigHandler } from './api/get-config.js';
import { saveConfigHandler } from './api/save-config.js';
import { generateHandler } from './api/generate.js';
import { listReportsHandler } from './api/list-reports.js';
import { getReportHandler } from './api/get-report.js';

export { initBriefingDatabase };

export const handleBriefingApi = async (req, res, path) => {
  if (path === '/api/apps/briefing/config' && req.method === 'GET') {
    return json(res, getConfigHandler());
  }

  if (path === '/api/apps/briefing/config' && req.method === 'POST') {
    const body = await readBody(req);
    const data = saveConfigHandler(body);
    return json(res, data);
  }

  if (path === '/api/apps/briefing/generate' && req.method === 'POST') {
    const body = await readBody(req);
    const data = await generateHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/api/apps/briefing/list' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const page = Number(url.searchParams.get('page') || 1);
    const pageSize = Number(url.searchParams.get('pageSize') || 10);
    return json(res, listReportsHandler({ page, pageSize }));
  }

  if (path === '/api/apps/briefing/detail' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const id = Number(url.searchParams.get('id') || 0);
    const data = getReportHandler({ id });
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  return false;
};
