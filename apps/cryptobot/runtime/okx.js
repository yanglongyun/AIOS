import crypto from 'crypto';
import { nowIso } from '../db.js';

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
