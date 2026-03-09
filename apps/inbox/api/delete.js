import { removeMessage } from '../service/delete.js';

export const deleteHandler = (body) => {
  return removeMessage(body);
};
