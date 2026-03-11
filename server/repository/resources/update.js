import { db } from '../../db/client.js';

export const updateResourceById = (id, title, content) => {
  db.prepare('UPDATE resources SET title = ?, content = ? WHERE id = ?').run(title, content, id);
};
