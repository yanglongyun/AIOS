import { db } from '../../db/client.js';
import { broadcast } from '../../system/ws.js';

export const updateSettings = (body) => {
  if (body.provider !== undefined) db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('provider', body.provider);
  if (body.systemPrompt !== undefined) db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('systemPrompt', body.systemPrompt);
  if (body.language !== undefined) db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('language', body.language === 'en' ? 'en' : 'zh');
  if (body.contextRounds !== undefined) db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('contextRounds', String(Number(body.contextRounds)));
  if (body.apiUrl !== undefined) db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('apiUrl', body.apiUrl);
  if (body.apiKey !== undefined) db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('apiKey', body.apiKey);
  if (body.model !== undefined) db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('model', body.model);
  if (body.enableFollowupSuggestions !== undefined) {
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('enableFollowupSuggestions', body.enableFollowupSuggestions ? '1' : '0');
  }
  if (body.enableToolResultTruncate !== undefined) {
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('enableToolResultTruncate', body.enableToolResultTruncate ? '1' : '0');
  }
  if (body.toolResultMaxChars !== undefined) {
    const value = Math.max(1000, Math.min(50000, Number(body.toolResultMaxChars) || 12000));
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('toolResultMaxChars', String(value));
  }
  if (body.enableToolLoopLimit !== undefined) {
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('enableToolLoopLimit', body.enableToolLoopLimit ? '1' : '0');
  }
  if (body.toolMaxRounds !== undefined) {
    const value = Math.max(1, Math.min(500, Number(body.toolMaxRounds) || 50));
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('toolMaxRounds', String(value));
  }
  if (body.enableAvatarEmoji !== undefined) {
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('enableAvatarEmoji', body.enableAvatarEmoji ? '1' : '0');
  }
  if (body.enableAvatarSound !== undefined) {
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('enableAvatarSound', body.enableAvatarSound ? '1' : '0');
  }
  if (body.avatarName !== undefined) {
    const value = String(body.avatarName || '').trim().slice(0, 24) || 'AIOS';
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('avatarName', value);
  }
  broadcast({ type: 'settings_changed' });
  return { ok: true };
};
