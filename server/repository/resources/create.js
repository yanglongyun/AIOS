import { db } from '../../db/client.js';

export const insertResource = (title, content) => {
  const result = db.prepare('INSERT INTO resources (title, content) VALUES (?, ?)').run(title, content);
  return result.lastInsertRowid;
};
