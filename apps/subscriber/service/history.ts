import { countDailies, listDailies } from '../repository/history.ts';

export const getHistory = ({ page = 1, pageSize = 10 } = {}) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.min(30, Math.max(1, Number(pageSize) || 10));
  const offset = (safePage - 1) * safePageSize;

  const total = countDailies();
  const items = listDailies(safePageSize, offset);

  return {
    success: true,
    items,
    page: safePage,
    pageSize: safePageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / safePageSize))
  };
};
