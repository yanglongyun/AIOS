import { db } from './client.js';

export const deleteById = (id) => {
  db.prepare('DELETE FROM inbox_messages WHERE id = ?').run(id);
};
