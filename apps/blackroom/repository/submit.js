import { db } from './client.js';

export const insertRecord = ({ complaint, poopCount, agentResponse, note }) => {
  const ret = db.prepare(`
    INSERT INTO apps_blackroom_records (complaint, poop_count, agent_response, note, created_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `).run(complaint, poopCount, agentResponse, note);

  return db.prepare(`
    SELECT
      id,
      complaint,
      poop_count AS poopCount,
      agent_response AS agentResponse,
      created_at AS createdAt
    FROM apps_blackroom_records
    WHERE id = ?
    LIMIT 1
  `).get(ret.lastInsertRowid);
};
