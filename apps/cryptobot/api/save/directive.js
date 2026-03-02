import { db } from '../../db.js';

const extractInstId = (text) => {
  if (!text) return 'BTC-USDT';
  const pair = text.match(/\b([A-Z]{2,10})-USDT\b/i);
  if (pair) return pair[0].toUpperCase();
  const coin = text.match(/\b(BTC|ETH|SOL|DOGE|XRP|ADA|DOT|MATIC|AVAX|LINK|UNI|ATOM|BNB|TRX|SHIB|ARB|OP)\b/i);
  if (coin) return `${coin[0].toUpperCase()}-USDT`;
  return 'BTC-USDT';
};

export const saveDirectiveHandler = (body = {}) => {
  const directive = String(body.directive || '').trim();
  const instId = extractInstId(directive);
  db.prepare(`
    UPDATE apps_cryptobot_config
    SET directive = ?, inst_id = ?, updated_at = datetime('now')
    WHERE id = 1
  `).run(directive, instId);
  return { success: true };
};
