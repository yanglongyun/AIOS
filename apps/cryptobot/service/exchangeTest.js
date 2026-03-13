import { getConfig } from '../repository/config.js';
import { okxRequest } from '../runtime/okx.js';

export const testExchange = async (body = {}) => {
  const saved = getConfig();
  const baseUrl = String(saved.base_url || '').trim();
  const apiKey = String(body.api_key ?? '').trim();
  const apiSecret = String(body.api_secret ?? '').trim();
  const passphrase = String(body.passphrase ?? '').trim();
  const cfg = {
    base_url: baseUrl,
    api_key: apiKey,
    api_secret: apiSecret,
    passphrase
  };

  if (!cfg.base_url || !cfg.api_key || !cfg.api_secret || !cfg.passphrase) {
    throw new Error('base_url、API Key、Secret、Passphrase 均不能为空');
  }

  await okxRequest(cfg, 'GET', '/api/v5/account/balance');
  return { success: true, message: '连接成功' };
};
