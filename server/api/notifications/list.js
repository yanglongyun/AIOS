import { db } from '../../db/client.js';

export const listNotifications = ({ limit = 20 } = {}) => {
  return db.prepare('SELECT * FROM notifications ORDER BY id DESC LIMIT ?').all(limit);
};

export const countUnread = () => {
  return db.prepare('SELECT COUNT(*) as count FROM notifications WHERE read = 0').get().count;
};
