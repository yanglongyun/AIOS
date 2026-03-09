import { list } from '../service/list.js';

export const listHandler = (query = {}) => {
  return list(query);
};
