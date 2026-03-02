import { db } from './client.js';

export const getSettings = () => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const obj = {};
  for (const r of rows) obj[r.key] = r.value;
  return {
    provider: obj.provider || 'openai',
    systemPrompt: obj.systemPrompt || '',
    contextRounds: Number(obj.contextRounds) || 30,
    apiUrl: obj.apiUrl || 'https://api.openai.com/v1/chat/completions',
    apiKey: obj.apiKey || '',
    model: obj.model || 'gpt-5.2',
    enableFollowupSuggestions: obj.enableFollowupSuggestions === undefined ? true : obj.enableFollowupSuggestions === '1'
  };
};
