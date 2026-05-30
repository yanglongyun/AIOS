import * as http from '@/utils/api.js';

// ── Projects ──────────────────────────────────────────────────────────────────
export const listProjects = () => http.get('/apps/demogen/projects');
export const getProject = (id) => http.get('/apps/demogen/project', { query: { id } });
export const createProject = (body) => http.post('/apps/demogen/project', body);
export const updateProject = (id, fields) => http.patch('/apps/demogen/project', { id, ...fields });
export const deleteProject = (id) => http.del('/apps/demogen/project', { query: { id } });

// ── Generation (backend-driven) ────────────────────────────────────────────────
export const generatePlan = (id) => http.post('/apps/demogen/project/plan', { id });
export const buildAll = (id) => http.post('/apps/demogen/project/build', { id });
export const buildWork = (id) => http.post('/apps/demogen/work/build', { id });
export const iterateWork = (id, instruction) => http.post('/apps/demogen/work/iterate', { id, instruction });
export const resolveWork = (id, status) => http.post('/apps/demogen/work/resolve', { id, status });
export const deleteWork = (id) => http.del('/apps/demogen/work', { query: { id } });

// ── Task (main server) — used for status polling & log view ─────────────────────
export const getTaskDetail = (id) => http.get('/api/task/detail', { query: { id } });
export const getTaskMessages = (id) => http.get('/api/task/messages', { query: { id } });
export const stopTask = (id) => http.post('/api/task/stop', { id });

// ── Local file preview URL (served by main server /api/fs/read) ─────────────────
export const fileUrl = (absPath) =>
  absPath ? `/api/fs/read?path=${encodeURIComponent(absPath)}` : '';
