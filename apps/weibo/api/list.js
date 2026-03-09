import { list } from '../service/list.js';

export const listHandler = (params = {}) => {
  return list(params);
};
