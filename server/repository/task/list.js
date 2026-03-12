import { db } from '../client.js';

export const listTasksByLimit = (limit) => {
  return db.prepare('SELECT * FROM tasks ORDER BY id DESC LIMIT ?').all(limit);
};
