import { divine } from '../service/divine.js';

export const divineHandler = async (body = {}, req) => {
  const question = String(body.question || '').trim();
  if (!question) return { status: 400, message: '请输入你的问题' };

  const hexagram = String(body.hexagram || '').trim();
  const yaos = String(body.yaos || '').trim();

  try {
    return await divine({ question, hexagram, yaos, req });
  } catch (e) {
    return { status: 500, message: e.message || '占卜失败' };
  }
};
