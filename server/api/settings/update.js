import { db } from '../../db/client.js';

export const updateSettings = (body) => {
  if (body.systemPrompt !== undefined) db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('systemPrompt', body.systemPrompt);
  if (body.contextRounds !== undefined) db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('contextRounds', String(Number(body.contextRounds)));
  if (body.apiUrl !== undefined) db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('apiUrl', body.apiUrl);
  if (body.apiKey !== undefined) db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('apiKey', body.apiKey);
  if (body.model !== undefined) db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('model', body.model);
  if (body.enableFollowupSuggestions !== undefined) {
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('enableFollowupSuggestions', body.enableFollowupSuggestions ? '1' : '0');
  }
  return { ok: true };
};
