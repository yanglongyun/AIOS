import { listSettingRows } from '../../repository/settings/get.js';

export const normalizeContextRounds = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 100;
  if (num <= 30) return 30;
  if (num <= 100) return 100;
  return 500;
};

export const getSettings = () => {
  const rows = listSettingRows();
  const obj = {};
  for (const r of rows) obj[r.key] = r.value;

  const toolResultMaxChars = Math.max(1000, Math.min(50000, Number(obj.toolResultMaxChars) || 12000));
  const toolMaxRounds = Math.max(1, Math.min(500, Number(obj.toolMaxRounds) || 50));

  const litellmUrl = process.env.LITELLM_URL;
  const litellmKey = process.env.LITELLM_KEY;

  return {
    provider: obj.provider || 'openai',
    systemPrompt: obj.systemPrompt || '',
    language: obj.language || 'zh',
    contextRounds: normalizeContextRounds(obj.contextRounds),
    apiUrl: litellmUrl || obj.apiUrl || 'https://api.openai.com/v1/chat/completions',
    apiKey: litellmKey || obj.apiKey || '',
    model: obj.model || 'gpt-5.2',
    enableToolResultTruncate: obj.enableToolResultTruncate === undefined ? true : obj.enableToolResultTruncate === '1',
    toolResultMaxChars,
    enableToolLoopLimit: obj.enableToolLoopLimit === undefined ? true : obj.enableToolLoopLimit === '1',
    toolMaxRounds
  };
};
