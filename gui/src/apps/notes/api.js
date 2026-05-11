// notes 请求层

import * as api from '@/utils/api.js';

const BASE = '/apps/notes';

export const listNotes = () => api.get(`${BASE}/list`);
export const saveNote = (note) => api.post(`${BASE}/save`, note);
export const pinNote = (id, pinned) => api.post(`${BASE}/pin`, { id, pinned });
export const deleteNote = (id) => api.post(`${BASE}/delete`, { id });
