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
  const data = await request('/api/fs/upload?dir=files/uploads', {
    method: 'POST',
    body: form
  });
  return data.files?.[0] || null;
};
