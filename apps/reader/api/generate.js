import { generate } from '../service/generate.js';

export const generateHandler = async (body = {}, req) => {
  const sessionId = Number(body.sessionId);
  const action = String(body.action || '').trim() || '开始故事';

  return await generate({ sessionId, action, req });
};
