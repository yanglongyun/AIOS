import { db } from '../db.js';

export const listHandler = ({ read = 'all' } = {}) => {
  let where = '';
  if (read === 'unread') where = 'WHERE is_read = 0';
  if (read === 'read') where = 'WHERE is_read = 1';

  const items = db.prepare(`
    SELECT id, name, email, content, source_ip, is_read, created_at
    FROM inbox_messages
    ${where}
    ORDER BY is_read ASC, id DESC
  `).all();

  const unread = db.prepare('SELECT COUNT(*) AS c FROM inbox_messages WHERE is_read = 0').get().c;
  return { success: true, data: items, unread };
};
