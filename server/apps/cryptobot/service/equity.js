import { getConfig } from "../repository/config.js";
import { listEquity } from "../repository/equity.js";
import { parseNum } from "../repository/client.js";

const VALID_RANGES = new Set(["1D", "1W", "1M", "ALL"]);

// 真实净值曲线:取历史采样点 + 基准本金,前端据此画图并着色盈亏。
const getEquityHistory = (range = "ALL") => {
  const r = VALID_RANGES.has(range) ? range : "ALL";
  const cfg = getConfig();
  const initial = parseNum(cfg.initial_equity);
  const rows = listEquity(r);
  const points = rows.map((row) => ({
    t: row.created_at,
    v: parseNum(row.equity)
  }));
  return {
    success: true,
    range: r,
    initial,
    points
  };
};

export { getEquityHistory };
