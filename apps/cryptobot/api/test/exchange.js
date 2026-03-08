import { getConfig } from '../../db.js';
import { okxRequest } from '../../runtime/okx.js';

export const testExchangeHandler = async (body = {}) => {
  const saved = getConfig();
  const pick = (input, fallback) => {
    if (input === undefined || input === null) return fallback;
    const text = String(input).trim();
    return text ? text : fallback;
  };
  const cfg = {
    base_url: pick(body.base_url, saved.base_url || 'https://www.okx.com'),
    api_key: pick(body.api_key, saved.api_key),
    api_secret: pick(body.api_secret, saved.api_secret),
    passphrase: pick(body.passphrase, saved.passphrase),
  };

  if (!cfg.api_key || !cfg.api_secret || !cfg.passphrase) {
    throw new Error('API Key、Secret、Passphrase 均不能为空');
  }

  await okxRequest(cfg, 'GET', '/api/v5/account/balance');
  return { success: true, message: '连接成功' };
};
