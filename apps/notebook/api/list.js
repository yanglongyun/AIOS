import { listNotebook } from '../service/list.js';

export const listHandler = ({ q = '', page = 1, pageSize = 10 } = {}) => {
  return listNotebook({ q, page, pageSize });
};
