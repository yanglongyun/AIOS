import type { AnyRecord } from '../../../shared/types.ts';
import { listGames } from '../repository/game.ts';

export const getGameList = (query: AnyRecord = {}) => {
  const page = Math.max(1, Number(query.page || 1));
  const pageSize = Math.max(1, Math.min(50, Number(query.pageSize || 20)));
  const offset = (page - 1) * pageSize;

  const { items, total } = listGames({ pageSize, offset });
  return { success: true, items, total, page, pageSize };
};
