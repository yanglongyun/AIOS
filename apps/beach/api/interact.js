import { interact } from '../service/interact.js';

export const interactHandler = async (body = {}, req) => {
  const action = String(body.action || '').trim();
  if (!action) return { status: 400, message: '请输入你的动作' };

  try {
    return await interact({ action, req });
  } catch (e) {
    return { status: 500, message: e.message || '互动失败' };
  }
};
