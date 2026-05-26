import * as api from "@/utils/api.js";

const BASE = "/apps/codex";

const status = () => api.get(`${BASE}/status`);
const start = () => api.post(`${BASE}/start`, {});
const stop = () => api.post(`${BASE}/stop`, {});
const createThread = (body = {}) => api.post(`${BASE}/thread`, body);
const readThread = (threadId) => api.get(`${BASE}/thread`, { query: { threadId } });
const listThreads = (query = {}) => api.get(`${BASE}/threads`, { query });
const runTurn = (body = {}) => api.post(`${BASE}/turn`, body);
const inspect = (query = {}) => api.get(`${BASE}/inspect`, { query });

export {
  createThread,
  inspect,
  listThreads,
  readThread,
  runTurn,
  start,
  status,
  stop,
};
