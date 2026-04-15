import { db } from "../client.js";

const countTimelineItems = () => {
  const row = db.prepare("SELECT COUNT(*) AS count FROM timeline").get();
  return Number(row?.count || 0);
};

const listTimelineItemsPaged = (limit = 30, offset = 0) => {
  return db
    .prepare(
      `SELECT
         t.id,
         t.source_app,
         t.source_ref,
         t.kind,
         t.title,
         t.content,
         t.metadata,
         t.created_at,
         CASE WHEN t.source_app = 'chat' THEN c.title ELSE NULL END AS conversation_title
       FROM timeline t
       LEFT JOIN chats c ON t.source_app = 'chat' AND c.conversation_id = t.source_ref
       ORDER BY datetime(t.created_at) DESC, t.id DESC
       LIMIT ? OFFSET ?`
    )
    .all(Number(limit), Number(offset));
};

export {
  countTimelineItems,
  listTimelineItemsPaged
};
