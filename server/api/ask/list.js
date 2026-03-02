import { db } from '../../db/client.js';

export const listAskRecords = ({ limit = 20 } = {}) => {
  return db.prepare('SELECT * FROM asks ORDER BY id DESC LIMIT ?').all(limit);
};
