import { readBody } from '../app_shared/utils/readBody.js';
import { json } from '../app_shared/utils/json.js';
import { initDebateDatabase } from './db.js';
import { partiesHandler } from './api/parties.js';
import { startHandler } from './api/start.js';
import { debateHandler } from './api/debate.js';
import { optimizeHandler } from './api/optimize.js';
import { summaryHandler } from './api/summary.js';
import { continueHandler } from './api/continue.js';
import { finishHandler } from './api/finish.js';
import { saveHandler } from './api/save.js';

export { initDebateDatabase };

export const handleDebateApi = async (req, res, path) => {
  if (path === '/api/apps/debate/parties' && req.method === 'POST') {
    const body = await readBody(req);
    return json(res, partiesHandler(body));
  }

  if (path === '/api/apps/debate/start' && req.method === 'POST') {
    const body = await readBody(req);
    const data = await startHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/api/apps/debate/debate' && req.method === 'POST') {
    const body = await readBody(req);
    const data = await debateHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/api/apps/debate/optimize' && req.method === 'POST') {
    const body = await readBody(req);
    const data = await optimizeHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/api/apps/debate/summary' && req.method === 'POST') {
    const body = await readBody(req);
    const data = await summaryHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/api/apps/debate/continue' && req.method === 'POST') {
    const body = await readBody(req);
    const data = await continueHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/api/apps/debate/finish' && req.method === 'POST') {
    const body = await readBody(req);
    const data = await finishHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/api/apps/debate/save' && req.method === 'POST') {
    const body = await readBody(req);
    const data = saveHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  return false;
};
