import { reset } from '../service/reset.js';

export const resetHandler = (body = {}) => {
  return reset(body);
};
