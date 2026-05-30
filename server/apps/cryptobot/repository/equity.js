import { db } from "./client.js";
import { toDateKey } from "../../../shared/time/dateKey.js";
const persistEquity = (equity) => {
  db.prepare("INSERT INTO cryptobot_equity (equity, created_at) VALUES (?, datetime('now'))").run(equity);
};
const getTodayChange = (currentEquity) => {
  const todayStr = toDateKey();
  const first = db.prepare("SELECT equity FROM cryptobot_equity WHERE date(created_at) = ? ORDER BY id ASC LIMIT 1").get(todayStr);
  if (!first) return 0;
  return currentEquity - first.equity;
};

// range -> SQLite 时间下界。ALL 不过滤。
const RANGE_SQL = {
  "1D": "-1 day",
  "1W": "-7 days",
  "1M": "-1 month",
  ALL: null
};

const listEquity = (range = "ALL", limit = 1000) => {
  const span = RANGE_SQL[range] ?? null;
  const size = Math.min(2000, Math.max(2, Number(limit) || 1000));
  const rows = span
    ? db.prepare(
        `SELECT id, equity, created_at FROM cryptobot_equity
         WHERE created_at >= datetime('now', ?)
         ORDER BY id ASC LIMIT ?`
      ).all(span, size)
    : db.prepare(
        `SELECT id, equity, created_at FROM cryptobot_equity
         ORDER BY id ASC LIMIT ?`
      ).all(size);
  return rows;
};

export {
  getTodayChange,
  listEquity,
  persistEquity
};
