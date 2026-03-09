import { generate } from '../service/generation.js';

export const generationHandler = async (body = {}, req) => {
  const { history, now, choices, next } = body;

  if (!now && !next) return { status: 400, message: '缺少参数' };

  try {
    return await generate({ history, now, choices, next, req });
  } catch (error) {
    return { status: 500, message: error.message || 'generation failed' };
  }
};
