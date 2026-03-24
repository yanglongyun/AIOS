import { db } from './client.ts';

export const deleteNoteById = (id) => {
  db.prepare('DELETE FROM notes WHERE id = ?').run(id);
};
