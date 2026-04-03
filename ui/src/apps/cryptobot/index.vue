<template>
  <div class="cryptobot-page flex h-full flex-col items-center overflow-y-auto font-['Courier_New',Courier,monospace]">
    <CryptobotMachinePanel
      :status="status"
      :error="error"
      v-model:panelOpen="panelOpen"
      v-model:goal="goal"
      :slider-idx="sliderIdx"
      :intervals="INTERVALS"
      :slider-bg="sliderBg"
      :countdown-label="countdownLabel"
      :countdown-progress="countdownProgress"
      :test-result="testResult"
      :testing-ex="testingEx"
      :ex-form="exForm"
      :fmt-num="fmtNum"
      @start="doStart"
      @stop="doStop"
      @save-goal="doSaveGoal"
      @slider-input="onSliderInput"
      @test-exchange="doTestExchange"
      @mark-exchange-dirty="exDirty = true"
      @save-all="doSaveAll"
    />

    <CryptobotDecisionPaper
      :status="status"
      :decisions="decisions"
      :has-more="hasMore"
      :fmt-time="fmtTime"
      @load-more="loadMoreDecisions"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import CryptobotMachinePanel from './CryptobotMachinePanel.vue';
import CryptobotDecisionPaper from './CryptobotDecisionPaper.vue';

const API = '/aios/apps/cryptobot';
const INTERVALS = [1, 2, 5, 10, 15, 30, 60];

const error = ref('');
let poller = null;
let ticker = null;
const nowTs = ref(Date.now());

const status = reactive({
  config: { api_key: '', api_secret: '', passphrase: '', has_keys: false, goal: '', interval_sec: 300, updated_at: '', base_url: '' },
  state: { running: false, executing: false, tick_count: 0, started_at: '', last_run_at: '', last_error: null, last_error_at: null },
  equity: { current: 0, initial: 0, pnl: 0, pnl_ratio: 0, today_change: 0 }
});

const panelOpen = ref(false);
const exDirty = ref(false);
const exForm = reactive({ api_key: '', api_secret: '', passphrase: '' });
const testingEx = ref(false);
const testResult = ref(null);
const goal = ref('');
const sliderIdx = ref(2);
const decisions = ref([]);
const decisionLimit = ref(50);
const hasMore = ref(false);

const api = async (path, opts = {}) => {
  const r = await fetch(`${API}${path}`, opts);
  const d = await r.json();
  if (!r.ok || d.success === false) throw new Error(d.message || `HTTP ${r.status}`);
  return d;
};

const post = (path, body) => api(path, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
});

const loadStatus = async () => {
  const d = await api('/status');
  Object.assign(status.config, d.config || {});
  Object.assign(status.state, d.state || {});
  Object.assign(status.equity, d.equity || {});
};

const syncExFormFromStatus = () => {
  exForm.api_key = status.config.api_key || '';
  exForm.api_secret = status.config.api_secret || '';
  exForm.passphrase = status.config.passphrase || '';
  exDirty.value = false;
};

const loadDecisions = async () => {
  const d = await api(`/decisions?limit=${decisionLimit.value}`);
  const items = d.items || [];
  decisions.value = items;
  hasMore.value = items.length >= decisionLimit.value;
};

const loadAll = () => Promise.all([loadStatus(), loadDecisions()]);

const loadMoreDecisions = () => {
  decisionLimit.value += 50;
  loadDecisions();
};

const doTestExchange = async () => {
  testingEx.value = true;
  testResult.value = null;
  try {
    await post('/exchange/test', exForm);
    testResult.value = { ok: true, msg: 'OK' };
  } catch (e) {
    testResult.value = { ok: false, msg: e.message };
  } finally {
    testingEx.value = false;
  }
};

const doSaveGoal = async () => {
  error.value = '';
  try {
    await post('/goal', { goal: goal.value });
    await loadStatus();
  } catch (e) {
    error.value = e.message;
  }
};

const doSaveAll = async () => {
  error.value = '';
  try {
    await Promise.all([
      post('/goal', { goal: goal.value }),
      post('/exchange', exForm)
    ]);
    await loadStatus();
    syncExFormFromStatus();
  } catch (e) {
    error.value = e.message;
  }
};

const doStart = async () => {
  error.value = '';
  try {
    await post('/start', { interval_sec: INTERVALS[sliderIdx.value] * 60 });
    await loadAll();
  } catch (e) {
    error.value = e.message;
  }
};

const doStop = async () => {
  error.value = '';
  try {
    await post('/stop');
    await loadAll();
  } catch (e) {
    error.value = e.message;
  }
};

const onSliderInput = (idx) => {
  sliderIdx.value = Number(idx);
  if (status.state.running) doStart();
};

const sliderBg = computed(() => {
  const pct = (sliderIdx.value / (INTERVALS.length - 1)) * 100;
  return { background: `linear-gradient(to right, #1aab40 0%, #1aab40 ${pct}%, #000 ${pct}%, #000 100%)` };
});

const countdownSec = computed(() => {
  if (!status.state.running) return null;
  if (status.state.executing) return 0;
  const intervalSec = Math.max(1, Number(status.config.interval_sec) || 300);
  const ref = status.state.last_run_at || status.state.started_at;
  if (!ref) return intervalSec;
  const refTs = new Date(ref).getTime();
  if (Number.isNaN(refTs)) return intervalSec;
  const elapsed = Math.floor((nowTs.value - refTs) / 1000);
  return Math.max(0, intervalSec - elapsed);
});

const countdownLabel = computed(() => {
  if (countdownSec.value === null) return '__T_CRYPTOBOT_COUNTDOWN_PAUSED__';
  if (status.state.executing) return '__T_CRYPTOBOT_COUNTDOWN_EXECUTING__';
  if (countdownSec.value <= 0) return '__T_CRYPTOBOT_COUNTDOWN_DUE__';
  const total = countdownSec.value;
  const mm = Math.floor(total / 60);
  const ss = total % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
});

const countdownProgress = computed(() => {
  if (countdownSec.value === null) return 0;
  const intervalSec = Math.max(1, Number(status.config.interval_sec) || 300);
  const done = intervalSec - countdownSec.value;
  return Math.min(100, Math.max(0, (done / intervalSec) * 100));
});

const fmtNum = (v, dec = 2) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return '-';
  return n.toLocaleString('en-US', { maximumFractionDigits: dec });
};

const fmtTime = (v) => {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const minToSliderIdx = (min) => {
  const idx = INTERVALS.indexOf(min);
  return idx >= 0 ? idx : 2;
};

let pendingRefresh = false;

onMounted(async () => {
  try {
    await loadAll();
    goal.value = status.config.goal || '__T_CRYPTOBOT_DEFAULT_DIRECTIVE__';
    sliderIdx.value = minToSliderIdx(Math.round((status.config.interval_sec || 300) / 60));
    syncExFormFromStatus();
    if (!status.config.has_keys) panelOpen.value = true;

    ticker = setInterval(() => {
      nowTs.value = Date.now();
      if (status.state.running && (status.state.executing || countdownSec.value <= 0) && !pendingRefresh) {
        pendingRefresh = true;
        setTimeout(() => {
          loadAll().catch(() => {}).finally(() => { pendingRefresh = false; });
        }, 3000);
      }
    }, 1000);

    poller = setInterval(() => loadAll().catch(() => {}), 30000);
  } catch (e) {
    error.value = e.message || '__T_CRYPTOBOT_INIT_FAILED__';
  }
});

onUnmounted(() => {
  if (poller) {
    clearInterval(poller);
    poller = null;
  }
  if (ticker) {
    clearInterval(ticker);
    ticker = null;
  }
});
</script>

<style scoped>
.cryptobot-page {
  background-color: #0d1117;
  background-image: repeating-linear-gradient(45deg, rgba(0,255,100,0.012) 0px, transparent 1px, transparent 12px);
}
</style>
