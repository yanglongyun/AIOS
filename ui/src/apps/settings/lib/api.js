import { request, postJson } from '@/system/http.js';

export { request };
export const loadSettings = () => request('/api/settings');
export const saveSettings = (body) => postJson('/api/settings', body);
