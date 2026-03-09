import { create } from '../service/create.js';

export const createHandler = (body = {}) => {
  return create(body);
};
