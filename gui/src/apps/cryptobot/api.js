// cryptobot 请求层

import * as api from '@/utils/api.js';

const BASE = '/apps/cryptobot';

export const getAgent = () => api.get(`${BASE}/agent`);
export const getDecisions = (limit = 50) => api.get(`${BASE}/decision/records`, { query: { limit } });
export const getPositions = () => api.get(`${BASE}/positions`);
export const getOrders = (instType = 'ANY', limit = 50) => api.get(`${BASE}/trade/orders`, { query: { instType, limit } });

export const startBot = () => api.post(`${BASE}/agent/start`, {});
export const stopBot = () => api.post(`${BASE}/agent/stop`, {});

export const saveConfig = (cfg) => api.post(`${BASE}/agent`, cfg);
export const testExchange = (cfg) => api.post(`${BASE}/agent/exchange/test`, cfg);
