import { deleteNotebook } from '../service/delete.js';

export const deleteHandler = (body = {}) => {
  return deleteNotebook(body);
};
