import { db } from '../../db/client.js';

export const listRequests = ({ limit = 20 } = {}) => {
  return db.prepare('SELECT * FROM requests ORDER BY id DESC LIMIT ?').all(limit);
};
