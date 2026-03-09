import { insertVersion } from '../repository/create.js';

export const create = (body = {}) => {
  const name = String(body.name || '').trim().slice(0, 80) || '未命名场景';
  const prompt = String(body.prompt || '').trim().slice(0, 2000);
  const html = String(body.html || '').trim();

  if (!html) return { success: false, message: '缺少 html', status: 400 };

  const id = insertVersion({ name, prompt, html });
  return { success: true, id };
};
