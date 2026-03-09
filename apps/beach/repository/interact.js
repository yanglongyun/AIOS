import { db } from './client.js';

export const insertLog = ({ action, aiResponse, aiReaction }) => {
  const ret = db.prepare(`
    INSERT INTO apps_beach_logs (action, ai_response, ai_reaction)
    VALUES (?, ?, ?)
  `).run(action, aiResponse, aiReaction);
  return db.prepare(`
    SELECT id, action, ai_response AS aiResponse, ai_reaction AS aiReaction, created_at AS createdAt
    FROM apps_beach_logs WHERE id = ?
  `).get(ret.lastInsertRowid);
};
