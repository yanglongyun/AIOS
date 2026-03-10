import { optimizeNotebook } from '../service/optimize.js';

export const optimizeHandler = async (body = {}, req) => {
  return await optimizeNotebook({ content: body.content, req });
};
