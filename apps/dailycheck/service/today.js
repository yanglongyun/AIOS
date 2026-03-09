import { toDateKey } from '../../../shared/time/dateKey.js';
import { insertIfNotExists, getLatestDaily, getStats, calcStreak } from '../repository/today.js';

const DEFAULT_QUESTION = '今天你最想推进的一件事是什么？为什么它重要？';

export const ensureTodayAndGet = async () => {
  const todayDate = toDateKey();
  insertIfNotExists(todayDate, DEFAULT_QUESTION);

  const dailyRow = getLatestDaily();
  const stats = getStats();

  return {
    success: true,
    today: dailyRow || null,
    stats: {
      totalDays: stats.total_days || 0,
      totalAnswers: stats.total_answers || 0,
      streak: calcStreak()
    }
  };
};
