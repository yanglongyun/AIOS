import { db } from './client.js';

export const insertMessage = (name, email, content, sourceIp) => {
  db.prepare(
    "INSERT INTO inbox_messages (name, email, content, source_ip, is_read, created_at) VALUES (?, ?, ?, ?, 0, datetime('now'))"
  ).run(name, email, content, sourceIp);
};
