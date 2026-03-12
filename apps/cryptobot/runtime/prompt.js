import { parseNum } from '../repository/client.js';

const formatCandles = (candles) => {
  return candles.slice(-20).map(c => {
    const d = new Date(c.ts);
    const t = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return `${t} | O:${c.open} H:${c.high} L:${c.low} C:${c.close} V:${Math.round(c.volume)}`;
  }).join('\n');
};

export const buildPrompt = (cfg, candles, equity, pnl, recentDecisions) => {
  const template = String(cfg.directive || '').trim();
  if (!template) {
    throw new Error('请先设置交易提示词模板');
  }

  const lastPrice = candles[candles.length - 1].close;
  const coinValue = parseNum(cfg.virtual_coin) * lastPrice;

  const decisionsText = recentDecisions.length
    ? recentDecisions.map(d => {
        const t = d.created_at?.slice(11, 16) || '??:??';
        const trade = d.action !== 'hold' && d.amount_usdt > 0 ? ` | ${d.action} ${d.amount_usdt.toFixed(1)}U @ ${d.price}` : '';
        return `${t} ${d.action.toUpperCase()}${trade} | ${d.reason}`;
      }).join('\n')
    : '-';

  const context = {
    base_url: cfg.base_url || 'https://www.okx.com',
    api_key: cfg.api_key || '',
    api_secret: cfg.api_secret || '',
    passphrase: cfg.passphrase || '',
    symbol: cfg.inst_id || 'BTC-USDT',
    usdt: parseNum(cfg.virtual_usdt).toFixed(2),
    coin: parseNum(cfg.virtual_coin).toFixed(6),
    coin_value: coinValue.toFixed(2),
    equity: Number(equity || 0).toFixed(2),
    initial_equity: parseNum(cfg.initial_equity).toFixed(2),
    pnl: `${pnl >= 0 ? '+' : ''}${Number(pnl || 0).toFixed(2)}`,
    candles: formatCandles(candles),
    recent_decisions: decisionsText
  };

  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    return Object.prototype.hasOwnProperty.call(context, key) ? String(context[key]) : '';
  });
};
