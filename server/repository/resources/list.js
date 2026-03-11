import { db } from '../../db/client.js';

export const listResourceRows = () => {
  return db.prepare('SELECT id, title, content, created_at FROM resources ORDER BY id ASC').all();
};
