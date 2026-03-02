import { generateHandler } from './generate.js';
import { listReportsHandler } from './list.js';
import { getReportHandler } from './detail.js';

export const handleReportApi = async ({ req, path, readBody, host }) => {
  if (path === '/apps/briefing/report/generate' && req.method === 'POST') {
    const body = await readBody(req);
    const data = await generateHandler(body);
    if (data?.status) return { status: data.status, data: { success: false, message: data.message } };
    return { data };
  }

  if (path === '/apps/briefing/report/list' && req.method === 'GET') {
    const url = new URL(req.url, `http://${host}`);
    const page = Number(url.searchParams.get('page') || 1);
    const pageSize = Number(url.searchParams.get('pageSize') || 10);
    return { data: listReportsHandler({ page, pageSize }) };
  }

  if (path === '/apps/briefing/report/detail' && req.method === 'GET') {
    const url = new URL(req.url, `http://${host}`);
    const id = Number(url.searchParams.get('id') || 0);
    const data = getReportHandler({ id });
    if (data?.status) return { status: data.status, data: { success: false, message: data.message } };
    return { data };
  }

  return false;
};

