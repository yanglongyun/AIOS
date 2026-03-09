import { createNote } from '../repository/create.js';

const parseSyncToAi = (value) => value === true || value === 1 || value === '1' || value === 'true';

const notifyAi = async ({ content, req }) => {
  const cookie = typeof req?.headers?.cookie === 'string' ? req.headers.cookie : '';
  await fetch('http://127.0.0.1:9700/api/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { cookie } : {})
    },
    body: JSON.stringify({
      app: 'notebook',
      title: '随心记同步',
      content: String(content || '').trim().slice(0, 1000)
    })
  });
};

export const createNotebook = async (body = {}, req) => {
  const content = String(body.content || '');
  const syncToAi = parseSyncToAi(body.syncToAi);

  const id = createNote({ content });

  if (syncToAi && content.trim()) {
    await notifyAi({ content, req }).catch(() => {});
  }

  return { id, syncToAi };
};
