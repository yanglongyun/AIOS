const request = async (url, options = {}) => {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `${res.status}`);
  return data;
};

export const listConversations = async () => {
  const res = await fetch('/api/chat/list');
  return res.json().catch(() => []);
};

export const createConversation = (title) => request('/api/chat/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title })
});

export const loadMessages = (chatId, offset = 0, limit = 20) => {
  const params = new URLSearchParams({ chatId, offset: String(offset), limit: String(limit) });
  return request(`/api/chat/messages?${params}`);
};

export const uploadChatFile = async (file) => {
  const form = new FormData();
  form.append('file', file, file.name);
  const data = await request('/api/fs/upload', {
    method: 'POST',
    body: form
  });
  return data.files?.[0] || null;
};

export const listTasks = async (limit = 200) => {
  const params = new URLSearchParams({ limit: String(limit) });
  return request(`/api/tasks?${params}`);
};

export const getTask = async (id) => {
  const params = new URLSearchParams({ id: String(id) });
  return request(`/api/tasks?${params}`);
};

export const abortTask = (id) => request(`/api/tasks?id=${encodeURIComponent(id)}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'aborted' })
});

export const listSubscriptions = async (limit = 200) => {
  const params = new URLSearchParams({ limit: String(limit) });
  return request(`/api/subscriptions?${params}`);
};

export const listMemories = async () => request('/api/memories?limit=500');

export const createMemory = (memory) => request('/api/memories', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(memory)
});

export const updateMemory = (id, memory) => request(`/api/memories?id=${encodeURIComponent(id)}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(memory)
});

export const deleteMemory = (id) => request(`/api/memories?id=${encodeURIComponent(id)}`, {
  method: 'DELETE'
});

export const listSkills = async () => request('/api/skills');

export const getSkill = async (id) => request(`/api/skills?id=${encodeURIComponent(id)}`);

export const getControls = async () => request('/api/controls');
