import { exec } from 'child_process';
import { db } from '../db/client.js';

export const shell = ({ command }) => {
  return new Promise((resolve) => {
    exec(command, { timeout: 30000, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        resolve(`exit code ${err.code}\n${stderr || err.message}`);
        return;
      }
      resolve(stdout || stderr || '(no output)');
    });
  });
};

export const update_chat_description = ({ chatId, description }) => {
  const id = String(chatId || '').trim();
  const desc = String(description || '').trim().slice(0, 1000);
  if (!id) return 'error: chatId is required';
  if (!desc) return 'error: description is required';

  const result = db.prepare('UPDATE chats SET description = ? WHERE id = ?').run(desc, id);
  if (!result.changes) return `error: chat not found (${id})`;
  return `ok: description updated for chat ${id}`;
};
