import { db } from '../../db/client.js';

export const renameChat = (sessionId, title) => {
  db.prepare('UPDATE chats SET title = ? WHERE session_id = ?').run(title, sessionId);
  return { ok: true };
};
