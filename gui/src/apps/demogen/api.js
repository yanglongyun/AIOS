import * as http from '@/utils/api.js';

// ── Projects ──────────────────────────────────────────────────────────────────
export const listProjects = () =>
  http.get('/apps/demogen/projects');

export const getProject = (id) =>
  http.get('/apps/demogen/project', { query: { id } });

export const createProject = (body) =>
  http.post('/apps/demogen/project', body);

export const updateProject = (id, fields) =>
  http.patch('/apps/demogen/project', { id, ...fields });

export const deleteProject = (id) =>
  http.del('/apps/demogen/project', { query: { id } });

// ── Plans ─────────────────────────────────────────────────────────────────────
export const savePlans = (project_id, plans, batch) =>
  http.post('/apps/demogen/project/plans', { project_id, plans, batch });

// ── Works ─────────────────────────────────────────────────────────────────────
export const launchWork = (work_id, task_id, batch) =>
  http.post('/apps/demogen/work/launch', { work_id, task_id, batch });

export const syncWorkStatus = (id, status) =>
  http.patch('/apps/demogen/work/status', { id, status });

export const deleteWork = (id) =>
  http.del('/apps/demogen/work', { query: { id } });

// ── Task (main server) ────────────────────────────────────────────────────────
export const createInstantTask = (body) =>
  http.post('/api/task/create/instant', body);

export const createAgentTask = (body) =>
  http.post('/api/task/create/agent', body);

export const getTaskDetail = (id) =>
  http.get('/api/task/detail', { query: { id } });

export const getTaskMessages = (id) =>
  http.get('/api/task/messages', { query: { id } });

export const continueTask = (id, content) =>
  http.post('/api/task/continue', { id, content });

export const stopTask = (id) =>
  http.post('/api/task/stop', { id });
