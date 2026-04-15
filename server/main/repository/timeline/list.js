import { db } from "../client.js";

const listRecentTimelineRows = (currentConversationId = "", limit = 10) => {
  const currentId = String(currentConversationId || "").trim();
  if (currentId) {
    return db
      .prepare(
        `SELECT id, source_app, source_ref, kind, title, content, created_at
         FROM timeline
         WHERE NOT (source_app = 'chat' AND source_ref = ?)
         ORDER BY datetime(created_at) DESC, id DESC
         LIMIT ?`
      )
      .all(currentId, limit);
  }
  return db
    .prepare(
      `SELECT id, source_app, source_ref, kind, title, content, created_at
       FROM timeline
       ORDER BY datetime(created_at) DESC, id DESC
       LIMIT ?`
    )
    .all(limit);
};

export {
  listRecentTimelineRows
};
