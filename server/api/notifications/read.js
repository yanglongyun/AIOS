import { db } from '../../db/client.js';

export const markRead = ({ id, reply }) => {
  db.prepare(
    "UPDATE notifications SET read = 1, reply = ?, read_at = datetime('now') WHERE id = ?"
  ).run(reply || '', id);
  return db.prepare('SELECT * FROM notifications WHERE id = ?').get(id);
};
