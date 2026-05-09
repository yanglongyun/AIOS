// subbox 请求层

import * as api from '@/utils/api.js';

const BASE = '/apps/subbox';

export const getConfig = () => api.get(`${BASE}/config`);
export const saveConfig = (patch) => api.post(`${BASE}/config`, patch);
export const runNow = () => api.post(`${BASE}/run-now`, {});

export const getReports = (limit = 100) => api.get(`${BASE}/reports`, { query: { limit } });
export const clearReports = () => api.post(`${BASE}/reports/clear`, {});
