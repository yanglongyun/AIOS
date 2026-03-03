import { db } from './client.js';

export const getSettings = () => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const obj = {};
  for (const r of rows) obj[r.key] = r.value;
  const toolResultMaxChars = Math.max(1000, Math.min(50000, Number(obj.toolResultMaxChars) || 12000));
  const toolMaxRounds = Math.max(1, Math.min(500, Number(obj.toolMaxRounds) || 50));
  return {
    provider: obj.provider || 'openai',
    systemPrompt: obj.systemPrompt || '',
    language: obj.language || 'zh',
    contextRounds: Number(obj.contextRounds) || 30,
    apiUrl: obj.apiUrl || 'https://api.openai.com/v1/chat/completions',
    apiKey: obj.apiKey || '',
    model: obj.model || 'gpt-5.2',
    enableFollowupSuggestions: obj.enableFollowupSuggestions === undefined ? true : obj.enableFollowupSuggestions === '1',
    enableToolResultTruncate: obj.enableToolResultTruncate === undefined ? true : obj.enableToolResultTruncate === '1',
    toolResultMaxChars,
    enableToolLoopLimit: obj.enableToolLoopLimit === undefined ? true : obj.enableToolLoopLimit === '1',
    toolMaxRounds,
    enableAvatarEmoji: obj.enableAvatarEmoji === undefined ? true : obj.enableAvatarEmoji === '1',
    enableAvatarSound: obj.enableAvatarSound === undefined ? false : obj.enableAvatarSound === '1',
    avatarName: String(obj.avatarName || 'AIOS').trim() || 'AIOS'
  };
};
