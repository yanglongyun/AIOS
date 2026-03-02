import { db } from '../../db/client.js';

export const createNotification = ({ app, title, content }) => {
  const row = db.prepare(
    'INSERT INTO notifications (app, title, content) VALUES (?, ?, ?) RETURNING *'
  ).get(app, title, content || '');
  return row;
};
