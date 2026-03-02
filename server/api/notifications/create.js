import { db } from '../../db/client.js';
import { broadcast } from '../../system/ws.js';

export const createNotification = ({ app, title, content }) => {
  const row = db.prepare(
    'INSERT INTO notifications (app, title, content) VALUES (?, ?, ?) RETURNING *'
  ).get(app, title, content || '');
  broadcast({ type: 'notifications_changed' });
  return row;
};
