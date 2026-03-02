import { db } from '../db.js';

export const submitHandler = (body = {}, sourceIp = '') => {
  const name = String(body.name || '').trim().slice(0, 80);
  const email = String(body.email || '').trim().slice(0, 120);
  const content = String(body.content || '').trim().slice(0, 4000);

  if (!content) return { success: false, message: '内容不能为空', status: 400 };

  db.prepare(
    "INSERT INTO inbox_messages (name, email, content, source_ip, is_read, created_at) VALUES (?, ?, ?, ?, 0, datetime('now'))"
  ).run(name, email, content, sourceIp);

  return { success: true };
};
