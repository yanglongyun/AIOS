import { getList } from '../service/list.js';

export const listHandler = (params) => {
  return getList(params);
};
