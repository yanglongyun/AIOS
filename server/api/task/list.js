import { db } from '../../db/client.js';

export const listTaskRecords = ({ limit = 20 } = {}) => {
  return db.prepare('SELECT * FROM tasks ORDER BY id DESC LIMIT ?').all(limit);
};
