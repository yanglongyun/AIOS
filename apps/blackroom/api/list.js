import { list } from '../service/list.js';

export const listHandler = ({ page, pageSize } = {}) => {
  return list({ page, pageSize });
};
