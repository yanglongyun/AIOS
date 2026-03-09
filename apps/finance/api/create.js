import { createFinance } from '../service/create.js';

export const createHandler = (body = {}) => {
  return createFinance(body);
};
