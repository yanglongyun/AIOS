import { getConfig, saveConfig } from "../../repository/config.js";
import { getState, saveState } from "../../repository/state.js";
import { recordDecision } from "../../repository/decisions.js";
import { persistEquity } from "../../repository/equity.js";
import { fetchAccountTotalEq } from "../okx.js";
import { requestDecisionTask } from "../task/decision.js";
const runTradingCycle = async () => {
  const cfg = getConfig();
  if (!cfg.goal) throw new Error("\u8BF7\u5148\u8BBE\u7F6E\u76EE\u6807");
  if (!cfg.api_key || !cfg.api_secret || !cfg.passphrase) throw new Error("\u8BF7\u5148\u914D\u7F6E OKX API Key/Secret/Passphrase");
  const result = await requestDecisionTask(cfg);
  let equity = 0;
  try {
    equity = await fetchAccountTotalEq(cfg);
  } catch {
    equity = 0;
  }
  if (equity > 0) {
    persistEquity(equity);
    saveConfig({ current_equity: equity });
  }
  recordDecision({
    summary: result.summary,
    taskId: result.task_id,
    ok: true,
    error: ""
  });
  const state = getState();
  saveState({
    running: state.running,
    tick_count: parseInt(state.tick_count || 0) + 1,
    started_at: state.started_at,
    last_error: "",
    last_error_at: ""
  });
};
export {
  runTradingCycle
};
