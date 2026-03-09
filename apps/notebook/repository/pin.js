import { db } from './client.js';

export const setNotePinned = ({ id, pinned }) => {
  db.prepare('UPDATE apps_notes SET pinned = ? WHERE id = ?').run(pinned ? 1 : 0, id);
};
