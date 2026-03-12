import { db } from '../client.js';

export const saveTaskMessage = (conversationId, msg, meta = null) => {
  db.prepare('INSERT INTO messages (conversation_id, message, meta) VALUES (?, ?, ?)').run(
    conversationId,
    JSON.stringify(msg),
    meta ? JSON.stringify(meta) : null
  );
};

export const insertInstantTaskRecord = ({
  conversationId,
  app,
  title,
  prompt,
  schema = null,
  meta = null
}) => {
  const row = db.prepare(
    "INSERT INTO tasks (conversation_id, app, title, mode, prompt, schema, meta, status) VALUES (?, ?, ?, 'instant', ?, ?, ?, 'pending') RETURNING id"
  ).get(
    conversationId,
    app,
    String(title || ''),
    prompt,
    schema ? JSON.stringify(schema) : null,
    meta ? JSON.stringify(meta) : null
  );
  return { taskId: row.id };
};

export const insertAgentTaskRecord = ({
  conversationId,
  app,
  title,
  prompt,
  meta = null,
  schedule_id = null
}) => {
  const row = db.prepare(
    "INSERT INTO tasks (conversation_id, app, title, mode, prompt, schema, meta, status, schedule_id) VALUES (?, ?, ?, 'agent', ?, NULL, ?, 'pending', ?) RETURNING id"
  ).get(
    conversationId,
    app,
    String(title || ''),
    prompt,
    meta ? JSON.stringify(meta) : null,
    schedule_id
  );
  return { taskId: row.id };
};

export const updateTaskDone = ({ taskId, response }) => {
  db.prepare(
    "UPDATE tasks SET response = ?, status = 'done', finished_at = datetime('now') WHERE id = ?"
  ).run(response, taskId);
};

export const updateTaskAborted = ({ taskId }) => {
  db.prepare(
    "UPDATE tasks SET error = '用户终止任务', status = 'aborted', finished_at = datetime('now') WHERE id = ?"
  ).run(taskId);
};

export const updateTaskError = ({ taskId, message }) => {
  db.prepare(
    "UPDATE tasks SET error = ?, status = 'error', finished_at = datetime('now') WHERE id = ?"
  ).run(message, taskId);
};

