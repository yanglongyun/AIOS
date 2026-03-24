import { db } from '../client.ts';

export const getTaskById = (id) => {
  return db.prepare('SELECT * FROM tasks WHERE id = ? LIMIT 1').get(id) || null;
};
