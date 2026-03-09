import { db } from './client.js';

export const deleteNoteById = (id) => {
  db.prepare('DELETE FROM apps_notes WHERE id = ?').run(id);
};
