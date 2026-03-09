import { getConfig, saveConfig } from '../repository/config.js';

const extractInstId = (text) => {
  if (!text) return '';
  const pair = text.match(/\b([A-Z]{2,10})-USDT\b/i);
  if (pair) return pair[0].toUpperCase();
  const coin = text.match(/\b(BTC|ETH|SOL|DOGE|XRP|ADA|DOT|MATIC|AVAX|LINK|UNI|ATOM|BNB|TRX|SHIB|ARB|OP)\b/i);
  if (coin) return `${coin[0].toUpperCase()}-USDT`;
  return '';
};

export const saveDirective = (body = {}) => {
  const directive = String(body.directive || '').trim();
  const current = getConfig();
  const parsedInstId = extractInstId(directive);
  const instId = parsedInstId || String(current.inst_id || '').toUpperCase();
  saveConfig({ directive, inst_id: instId });
  return { success: true };
};
