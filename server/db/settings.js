import { db } from './client.js';

export const normalizeContextRounds = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 100;
  if (num <= 30) return 30;
  if (num <= 100) return 100;
  return 500;
};

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
    contextRounds: normalizeContextRounds(obj.contextRounds),
    apiUrl: obj.apiUrl || 'https://api.openai.com/v1/chat/completions',
    apiKey: obj.apiKey || '',
    model: obj.model || 'gpt-5.2',
    enableToolResultTruncate: obj.enableToolResultTruncate === undefined ? true : obj.enableToolResultTruncate === '1',
    toolResultMaxChars,
    enableToolLoopLimit: obj.enableToolLoopLimit === undefined ? true : obj.enableToolLoopLimit === '1',
    toolMaxRounds
  };
};
