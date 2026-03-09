import crypto from 'crypto';
import { nowIso } from '../repository/client.js';

const signOkx = ({ ts, method, path, body, secret }) => {
  const prehash = `${ts}${method.toUpperCase()}${path}${body || ''}`;
  return crypto.createHmac('sha256', secret).update(prehash).digest('base64');
};

export const okxRequest = async (cfg, method, path, payload = null) => {
  const ts = nowIso();
  const body = payload ? JSON.stringify(payload) : '';
  const sign = signOkx({ ts, method, path, body, secret: cfg.api_secret });
  const resp = await fetch(`${cfg.base_url}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'OK-ACCESS-KEY': cfg.api_key,
      'OK-ACCESS-SIGN': sign,
      'OK-ACCESS-TIMESTAMP': ts,
      'OK-ACCESS-PASSPHRASE': cfg.passphrase
    },
    body: body || undefined
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || data.code !== '0') throw new Error(`OKX: ${data?.msg || resp.status}`);
  return data;
};

export const fetchCandles = async (cfg) => {
  const url = `${cfg.base_url}/api/v5/market/candles?instId=${encodeURIComponent(cfg.inst_id)}&bar=1H&limit=50`;
  const resp = await fetch(url);
  const data = await resp.json();
  if (!resp.ok || data.code !== '0') throw new Error(data?.msg || '行情获取失败');
  return (data.data || []).map(x => ({
    ts: Number(x[0]),
    open: Number(x[1]),
    high: Number(x[2]),
    low: Number(x[3]),
    close: Number(x[4]),
    volume: Number(x[5])
  })).filter(c => Number.isFinite(c.close)).reverse();
};

export const parseInstPair = (instId = 'BTC-USDT') => {
  const [base = 'BTC', quote = 'USDT'] = String(instId || 'BTC-USDT').toUpperCase().split('-');
  return { base, quote };
};

export const fetchSpotBalances = async (cfg, instId) => {
  const { base, quote } = parseInstPair(instId);
  const data = await okxRequest(cfg, 'GET', `/api/v5/account/balance?ccy=${encodeURIComponent(`${quote},${base}`)}`);
  const details = (data?.data?.[0]?.details || []);
  const findBal = (ccy) => {
    const row = details.find((x) => String(x.ccy || '').toUpperCase() === ccy);
    if (!row) return { avail: 0, cash: 0 };
    return {
      avail: Number(row.availBal || row.cashBal || 0) || 0,
      cash: Number(row.cashBal || row.availBal || 0) || 0
    };
  };

  const q = findBal(quote);
  const b = findBal(base);
  return {
    base,
    quote,
    quoteAvail: q.avail,
    quoteCash: q.cash,
    baseAvail: b.avail,
    baseCash: b.cash
  };
};

export const placeSpotMarketOrder = async ({ cfg, instId, side, size }) => {
  const { quote } = parseInstPair(instId);
  const payload = {
    instId,
    tdMode: 'cash',
    side,
    ordType: 'market',
    sz: String(size)
  };

  if (side === 'buy') {
    payload.tgtCcy = quote.toLowerCase();
  }

  const data = await okxRequest(cfg, 'POST', '/api/v5/trade/order', payload);
  const row = data?.data?.[0] || {};
  return {
    ordId: row.ordId || '',
    clOrdId: row.clOrdId || '',
    sCode: row.sCode || '0',
    sMsg: row.sMsg || ''
  };
};
