import { updateNotebook } from '../service/update.js';

export const updateHandler = (body = {}) => {
  return updateNotebook(body);
};
