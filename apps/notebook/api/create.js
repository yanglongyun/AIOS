import { createNotebook } from '../service/create.js';

export const createHandler = async (body = {}, req) => {
  return await createNotebook(body, req);
};
