import { detail } from '../service/detail.js';

export const detailHandler = (params = {}) => {
  return detail(params);
};
