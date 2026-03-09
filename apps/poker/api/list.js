import { getGameList } from '../service/list.js';

export const listHandler = (query = {}) => {
  return getGameList(query);
};
