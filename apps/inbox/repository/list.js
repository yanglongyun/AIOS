import { db } from './client.js';

export const queryMessages = (read = 'all') => {
  let where = '';
  if (read === 'unread') where = 'WHERE is_read = 0';
  if (read === 'read') where = 'WHERE is_read = 1';

  return db.prepare(`
    SELECT id, name, email, content, source_ip, is_read, reply_suggestion, created_at
    FROM inbox_messages
    ${where}
    ORDER BY is_read ASC, id DESC
  `).all();
};

export const countUnread = () => {
  return db.prepare('SELECT COUNT(*) AS c FROM inbox_messages WHERE is_read = 0').get().c;
};
