import { insertPost } from '../repository/create.js';

export const create = (body = {}) => {
  const content = String(body.content || '').trim();
  if (!content) return { status: 400, message: '内容不能为空' };
  if (content.length > 280) return { status: 400, message: '内容不能超过 280 字' };

  const item = insertPost(content);
  return { success: true, item };
};
