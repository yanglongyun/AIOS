import { db } from '../../db/client.js';

export const createNotificationRow = ({ app, title, content }) => {
  return db.prepare(
    'INSERT INTO notifications (app, title, content) VALUES (?, ?, ?) RETURNING *'
  ).get(app, title, content || '');
};
