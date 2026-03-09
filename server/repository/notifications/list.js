import { db } from '../../db/client.js';

export const listNotificationsByLimit = (limit) => {
  return db.prepare('SELECT * FROM notifications ORDER BY id DESC LIMIT ?').all(limit);
};

export const countUnreadNotifications = () => {
  return db.prepare('SELECT COUNT(*) as count FROM notifications WHERE read = 0').get().count;
};
