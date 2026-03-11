import { db } from '../../db/client.js';

export const deleteResourceById = (id) => {
  db.prepare('DELETE FROM resources WHERE id = ?').run(id);
};
