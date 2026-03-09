import { createNotebook } from '../service/create.js';

export const createHandler = async (body = {}) => {
  return await createNotebook(body);
};
