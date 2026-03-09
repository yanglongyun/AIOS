import { countRecords, getStats, listRecords } from '../repository/list.js';

export const list = ({ page = 1, pageSize = 10 } = {}) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.min(30, Math.max(1, Number(pageSize) || 10));
  const offset = (safePage - 1) * safePageSize;

  const total = countRecords();
  const stats = getStats();
  const items = listRecords({ limit: safePageSize, offset });

  return {
    success: true,
    items,
    page: safePage,
    pageSize: safePageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / safePageSize)),
    stats
  };
};
