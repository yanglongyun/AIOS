import { json } from '../../../shared/http/json.js';
import { readBody } from '../../../shared/http/readBody.js';
import { createNotification } from '../../service/notifications/create.js';
import { listNotifications } from '../../service/notifications/list.js';
import { markRead } from '../../service/notifications/read.js';

export const handleNotificationsApi = async (req, res, path, url) => {
  if (path === '/api/notifications' && req.method === 'GET') {
    const limit = Number(url.searchParams.get('limit') || 20);
    return json(res, listNotifications({ limit }));
  }

  if (path === '/api/notifications' && req.method === 'POST') {
    const { app, title, content } = await readBody(req);
    return json(res, createNotification({ app, title, content }));
  }

  if (path === '/api/notifications/read' && req.method === 'POST') {
    const { id, reply } = await readBody(req);
    return json(res, markRead({ id, reply }));
  }

  json(res, { error: 'not found' }, 404);
};
