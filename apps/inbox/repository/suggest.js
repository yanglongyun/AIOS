import { db } from './client.js';

export const getMessageById = (id) => {
  return db.prepare('SELECT id, name, email, content FROM inbox_messages WHERE id = ?').get(id);
};

export const updateReplySuggestion = (suggestion, id) => {
  db.prepare('UPDATE inbox_messages SET reply_suggestion = ? WHERE id = ?').run(suggestion, id);
};
