import { parseNum } from '../db.js';

const formatCandles = (candles) => {
  return candles.slice(-20).map(c => {
    const d = new Date(c.ts);
    const t = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return `${t} | O:${c.open} H:${c.high} L:${c.low} C:${c.close} V:${Math.round(c.volume)}`;
  }).join('\n');
};

export const buildPrompt = (cfg, candles, equity, pnl, recentDecisions) => {
  const lastPrice = candles[candles.length - 1].close;
  const coinValue = parseNum(cfg.virtual_coin) * lastPrice;

  const decisionsText = recentDecisions.length
    ? recentDecisions.map(d => {
        const t = d.created_at?.slice(11, 16) || '??:??';
        const trade = d.action !== 'hold' && d.amount_usdt > 0 ? ` | ${d.action} ${d.amount_usdt.toFixed(1)}U @ ${d.price}` : '';
        return `${t} ${d.action.toUpperCase()}${trade} | ${d.reason}`;
      }).join('\n')
    : '暂无';

  return `你是加密货币交易 AI。根据用户指令和市场数据做出决策。

## 用户交易指令
${cfg.directive || '默认保守策略，盯 BTC-USDT'}

## 当前账户（OKX 实盘）
可用 USDT: ${parseNum(cfg.virtual_usdt).toFixed(2)}
持有 ${cfg.inst_id}: ${parseNum(cfg.virtual_coin).toFixed(6)}（≈ ${coinValue.toFixed(2)} U）
总权益: ${equity.toFixed(2)} U（初始 ${parseNum(cfg.initial_equity)} U，累计 ${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} U）

## K 线（${cfg.inst_id}，1H，最近 20 根）
${formatCandles(candles)}

## 最近决策
${decisionsText}

返回 JSON：{"action":"buy或sell或hold","reason":"中文一句话30字内","amount_usdt":数字}

规则：
1. 严格遵守用户指令的风控要求（止盈止损、仓位限制等）
2. 没有明确信号必须 hold
3. amount_usdt 是本次操作金额，hold 时填 0
4. 只返回 JSON`;
};
