import * as api from '@/utils/api.js';

const BASE = '/apps/longvideo';

export const listProjects = () => api.get(`${BASE}/projects`);
export const getSettings = () => api.get(`${BASE}/settings`);
export const saveSettings = (payload) => api.post(`${BASE}/settings`, payload);
export const testImageSettings = () => api.post(`${BASE}/settings/test-image`, {});
export const testAudioSettings = () => api.post(`${BASE}/settings/test-audio`, {});
export const getProject = (id) => api.get(`${BASE}/project`, { query: { id } });
export const createProject = (payload) => api.post(`${BASE}/project`, payload);
export const generatePlan = (id) => api.post(`${BASE}/project/generate-plan`, { id });
export const generateAssets = (id) => api.post(`${BASE}/project/generate-assets`, { id });
export const assembleVideo = (id) => api.post(`${BASE}/project/assemble`, { id });
export const generatePrompt = (payload) => api.post('/api/task/create/instant', payload);
