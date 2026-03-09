import { del } from '../service/delete.js';

export const deleteHandler = (body = {}) => {
  return del(body);
};
