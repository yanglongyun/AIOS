import { placeSpotMarketOrder } from './okx.js';

const floorToStep = (n, step) => {
  if (!(n > 0) || !(step > 0)) return 0;
  return Math.floor(n / step) * step;
};

export const executeRealTrade = async ({ cfg, decision, lastPrice, balances }) => {
  if (decision.action === 'buy') {
    const spend = Math.min(Number(balances.quoteAvail || 0), Number(decision.amount_usdt || 0));
    if (spend < 1) return { executed: false, sizeCoin: 0, amountUsdt: 0, reason: '可用 USDT 不足' };

    const amountUsdt = Number(spend.toFixed(4));
    const order = await placeSpotMarketOrder({
      cfg,
      instId: cfg.inst_id,
      side: 'buy',
      size: amountUsdt
    });
    if (String(order.sCode || '0') !== '0') {
      return { executed: false, sizeCoin: 0, amountUsdt: 0, reason: `下单失败: ${order.sMsg || order.sCode || 'unknown'}` };
    }

    return {
      executed: true,
      sizeCoin: lastPrice > 0 ? amountUsdt / lastPrice : 0,
      amountUsdt,
      ordId: order.ordId || ''
    };
  }

  if (decision.action === 'sell') {
    const maxCoinByAmount = lastPrice > 0 ? Number(decision.amount_usdt || 0) / lastPrice : 0;
    const sellCoinRaw = Math.min(Number(balances.baseAvail || 0), maxCoinByAmount);
    const sellCoin = floorToStep(sellCoinRaw, 0.00000001);
    if (sellCoin <= 0) return { executed: false, sizeCoin: 0, amountUsdt: 0, reason: '可卖币余额不足' };

    const order = await placeSpotMarketOrder({
      cfg,
      instId: cfg.inst_id,
      side: 'sell',
      size: sellCoin
    });
    if (String(order.sCode || '0') !== '0') {
      return { executed: false, sizeCoin: 0, amountUsdt: 0, reason: `下单失败: ${order.sMsg || order.sCode || 'unknown'}` };
    }

    return {
      executed: true,
      sizeCoin: sellCoin,
      amountUsdt: sellCoin * lastPrice,
      ordId: order.ordId || ''
    };
  }

  return { executed: false, sizeCoin: 0, amountUsdt: 0, reason: '' };
};
