import { nowIso } from '../repository/client.ts';
import { getConfig, saveConfig } from '../repository/config.ts';
import { getState, saveState } from '../repository/state.ts';
import { runTradingCycle } from './cycle/run.ts';

let timer = null;
let executing = false;

const runBotOnce = async () => {
  if (!getState().running) return;
  executing = true;
  try {
    await runTradingCycle();
  } finally {
    executing = false;
    const state = getState();
    saveState({ ...state, last_run_at: nowIso() });
  }
};

export const startBot = (intervalSec) => {
  const cfg = getConfig();
  if (!cfg.api_key || !cfg.api_secret || !cfg.passphrase) {
    throw new Error('请先配置 OKX API Key/Secret/Passphrase');
  }
  if (!cfg.goal) {
    throw new Error('请先设置目标');
  }
  const sec = Math.max(60, parseInt(intervalSec || cfg.interval_sec || 300));

  if (timer) { clearTimeout(timer); timer = null; }

  saveConfig({ interval_sec: sec });
  const oldState = getState();
  saveState({ ...oldState, running: 1, started_at: nowIso(), tick_count: oldState.tick_count || 0 });

  const onError = (e) => {
    console.error('[cryptobot]', e.message);
    saveState({ ...getState(), last_error: e.message, last_error_at: nowIso() });
  };

  const scheduleNext = () => {
    timer = setTimeout(async () => {
      if (!getState().running) {
        timer = null;
        return;
      }
      try { await runBotOnce(); } catch (e) { onError(e); }
      if (getState().running) {
        scheduleNext();
      } else {
        timer = null;
      }
    }, sec * 1000);
  };

  runBotOnce()
    .catch(e => onError(e))
    .finally(() => { if (getState().running) scheduleNext(); });

  return getState();
};

export const stopBot = () => {
  if (timer) { clearTimeout(timer); timer = null; }
  return saveState({ ...getState(), running: 0 });
};

export const initRuntime = () => {
  const state = getState();
  if (state.running) {
    const cfg = getConfig();
    if (cfg.api_key && cfg.api_secret && cfg.passphrase && cfg.goal) {
      startBot(cfg.interval_sec);
    } else {
      saveState({ ...state, running: 0 });
    }
  }
};

export const isBotExecuting = () => executing;
