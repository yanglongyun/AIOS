import { saveSetting } from '../../repository/settings/save.js';
import { normalizeContextRounds } from './get.js';

const clampToolResultMaxChars = (value) => {
  return Math.max(1000, Math.min(50000, Number(value) || 12000));
};

const clampToolMaxRounds = (value) => {
  return Math.max(1, Math.min(500, Number(value) || 50));
};

export const updateSettings = (body = {}) => {
  if (body.provider !== undefined) saveSetting('provider', body.provider);
  if (body.systemPrompt !== undefined) saveSetting('systemPrompt', body.systemPrompt);
  if (body.language !== undefined) saveSetting('language', body.language === 'en' ? 'en' : 'zh');
  if (body.contextRounds !== undefined) saveSetting('contextRounds', String(normalizeContextRounds(body.contextRounds)));
  if (body.apiUrl !== undefined) saveSetting('apiUrl', body.apiUrl);
  if (body.apiKey !== undefined) saveSetting('apiKey', body.apiKey);
  if (body.model !== undefined) saveSetting('model', body.model);
  if (body.enableToolResultTruncate !== undefined) saveSetting('enableToolResultTruncate', body.enableToolResultTruncate ? '1' : '0');
  if (body.toolResultMaxChars !== undefined) saveSetting('toolResultMaxChars', String(clampToolResultMaxChars(body.toolResultMaxChars)));
  if (body.enableToolLoopLimit !== undefined) saveSetting('enableToolLoopLimit', body.enableToolLoopLimit ? '1' : '0');
  if (body.toolMaxRounds !== undefined) saveSetting('toolMaxRounds', String(clampToolMaxRounds(body.toolMaxRounds)));

  return { ok: true };
};
