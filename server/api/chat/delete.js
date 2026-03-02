import { db } from '../../db/client.js';

export const deleteChat = (sessionId) => {
  db.prepare('DELETE FROM messages WHERE session_id = ?').run(sessionId);
  db.prepare('DELETE FROM chats WHERE session_id = ?').run(sessionId);
  return { ok: true };
};
