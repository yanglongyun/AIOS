import { db } from './client.js';

export const updateIsRead = (isRead, id) => {
  db.prepare('UPDATE inbox_messages SET is_read = ? WHERE id = ?').run(isRead, id);
};
