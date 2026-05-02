<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { fmtTime } from './formatters';
import AgentTab from './tabs/AgentTab.vue';
import DecisionsTab from './tabs/DecisionsTab.vue';
import EquityPanel from './tabs/EquityPanel.vue';
import MarketTab from './tabs/MarketTab.vue';
import PositionsTab from './tabs/PositionsTab.vue';
import TradingTab from './tabs/TradingTab.vue';

const API = '/apps/cryptobot';
const INTERVALS = [1, 2, 5, 10, 15, 30, 60];

const TABS = [
    { key: 'agent',     label: '__T_CRYPTOBOT_TAB_AGENT__', icon: 'smart_toy' },
    { key: 'decisions', label: '__T_CRYPTOBOT_TAB_DECISIONS__', icon: 'receipt_long' },
    { key: 'trading',   label: '__T_CRYPTOBOT_TAB_TRADING__', icon: 'swap_horiz' },
    { key: 'positions', label: '__T_CRYPTOBOT_TAB_POSITIONS__', icon: 'account_balance_wallet' },
    { key: 'market',    label: '__T_CRYPTOBOT_TAB_MARKET__', icon: 'candlestick_chart' },
];

const GOAL_PRESETS = [
    { key: 'conservative', label: '__T_CRYPTOBOT_GOAL_CONSERVATIVE__', icon: 'shield',
      text: '__T_CRYPTOBOT_GOAL_CONSERVATIVE_TEXT__' },
    { key: 'balanced', label: '__T_CRYPTOBOT_GOAL_BALANCED__', icon: 'balance',
      text: '__T_CRYPTOBOT_GOAL_BALANCED_TEXT__' },
    { key: 'aggressive', label: '__T_CRYPTOBOT_GOAL_AGGRESSIVE__', icon: 'local_fire_department',
      text: '__T_CRYPTOBOT_GOAL_AGGRESSIVE_TEXT__' },
    { key: 'custom', label: '__T_CRYPTOBOT_GOAL_CUSTOM__', icon: 'tune', text: '' },
];

const activeTab = ref('agent');
const error = ref('');
let poller = null;
let ticker = null;
let posPoller = null;
let marketPoller = null;
let pendingRefresh = false;
const nowTs = ref(Date.now());

const status = reactive({
    config: { api_key: '', api_secret: '', passphrase: '', has_keys: false, goal: '', interval_sec: 300, updated_at: '', base_url: '' },
    state: { running: false, executing: false, tick_count: 0, started_at: '', last_run_at: '', last_error: null, last_error_at: null },
    equity: { current: 0, initial: 0, pnl: 0, pnl_ratio: 0, today_change: 0 }
});

const goalPreset = ref('custom');
const exForm = reactive({ api_key: '', api_secret: '', passphrase: '' });
const testingEx = ref(false);
const testResult = ref(null);
const goal = ref('');
const sliderIdx = ref(2);

const decisions = ref([]);
const decisionLimit = ref(50);
const hasMore = ref(false);
const selectedDecision = ref(null);

const marketItems = ref([]);
const marketUpdatedAt = ref('');
const marketLoading = ref(false);
const marketError = ref('');

const positionsData = ref(null);
const positionsLoading = ref(false);
const positionsError = ref('');

const orders = ref([]);
const orderInstType = ref('ANY');
const ordersLoading = ref(false);
const ordersError = ref('');

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

const matchPreset = (text) => {
    const t = String(text || '').trim();
    if (!t) return 'custom';
    const found = GOAL_PRESETS.find((p) => p.key !== 'custom' && p.text === t);
    return found ? found.key : 'custom';
};
const selectPreset = (key) => {
    goalPreset.value = key;
    if (key !== 'custom') {
        const preset = GOAL_PRESETS.find((p) => p.key === key);
        if (preset) goal.value = preset.text;
    }
};

const loadAgent = async () => {
    const d = await api('/agent');
    Object.assign(status.config, d.config || {});
    Object.assign(status.state, d.state || {});
    Object.assign(status.equity, d.equity || {});
};
const syncExFormFromAgent = () => {
    exForm.api_key = status.config.api_key || '';
    exForm.api_secret = status.config.api_secret || '';
    exForm.passphrase = status.config.passphrase || '';
};
const loadDecisionRecords = async () => {
    const d = await api(`/decision/records?limit=${decisionLimit.value}`);
    const items = d.items || [];
    decisions.value = items;
    hasMore.value = items.length >= decisionLimit.value;
};
const loadAll = () => Promise.all([loadAgent(), loadDecisionRecords()]);
const loadMoreDecisions = () => {
    decisionLimit.value += 50;
    loadDecisionRecords();
};

const loadMarket = async () => {
    marketLoading.value = true;
    marketError.value = '';
    try {
        const d = await api('/market');
        marketItems.value = d.items || [];
        marketUpdatedAt.value = d.updatedAt || '';
    } catch (e) {
        marketError.value = e.message;
    } finally {
        marketLoading.value = false;
    }
};
const loadPositions = async () => {
    positionsLoading.value = true;
    positionsError.value = '';
    try {
        const d = await api('/positions');
        positionsData.value = d;
    } catch (e) {
        positionsError.value = e.message;
    } finally {
        positionsLoading.value = false;
    }
};
const loadTradeOrders = async () => {
    ordersLoading.value = true;
    ordersError.value = '';
    try {
        const d = await api(`/trade/orders?instType=${orderInstType.value}&limit=50`);
        orders.value = d.items || [];
    } catch (e) {
        ordersError.value = e.message;
    } finally {
        ordersLoading.value = false;
    }
};

const doTestExchange = async () => {
    testingEx.value = true;
    testResult.value = null;
    try {
        await post('/agent/exchange/test', exForm);
        testResult.value = { ok: true, msg: '__T_CRYPTOBOT_CONNECTION_SUCCESS__' };
    } catch (e) {
        testResult.value = { ok: false, msg: e.message };
    } finally {
        testingEx.value = false;
    }
};
const doSaveAll = async () => {
    error.value = '';
    try {
        await post('/agent', { ...exForm, goal: goal.value });
        await loadAgent();
        syncExFormFromAgent();
    } catch (e) {
        error.value = e.message;
    }
};
const doStartAgent = async () => {
    error.value = '';
    try {
        await post('/agent/start', { interval_sec: INTERVALS[sliderIdx.value] * 60 });
        await loadAll();
    } catch (e) {
        error.value = e.message;
    }
};
const doStopAgent = async () => {
    error.value = '';
    try {
        await post('/agent/stop');
        await loadAll();
    } catch (e) {
        error.value = e.message;
    }
};
const onSliderInput = (idx) => {
    sliderIdx.value = Number(idx);
    if (status.state.running) doStartAgent();
};

const canStart = computed(() => Boolean(status.config.has_keys && String(status.config.goal || goal.value || '').trim()));
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
    if (countdownSec.value === null) return '__T_CRYPTOBOT_STOPPED__';
    if (status.state.executing) return '__T_CRYPTOBOT_EXECUTING__';
    if (countdownSec.value <= 0) return '__T_CRYPTOBOT_DUE_SOON__';
    const mm = Math.floor(countdownSec.value / 60);
    const ss = countdownSec.value % 60;
    return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
});
const countdownProgress = computed(() => {
    if (countdownSec.value === null) return 0;
    const intervalSec = Math.max(1, Number(status.config.interval_sec) || 300);
    const done = intervalSec - countdownSec.value;
    return Math.min(100, Math.max(0, (done / intervalSec) * 100));
});
const minToSliderIdx = (min) => {
    const idx = INTERVALS.indexOf(min);
    return idx >= 0 ? idx : 2;
};

watch(activeTab, (tab) => {
    if (posPoller) { clearInterval(posPoller); posPoller = null; }
    if (marketPoller) { clearInterval(marketPoller); marketPoller = null; }
    if (tab === 'positions') {
        loadPositions();
        posPoller = setInterval(() => { if (activeTab.value === 'positions') loadPositions(); }, 8000);
    }
    if (tab === 'trading') {
        loadTradeOrders();
    }
    if (tab === 'market') {
        loadMarket();
        marketPoller = setInterval(() => { if (activeTab.value === 'market') loadMarket(); }, 10000);
    }
});

onMounted(async () => {
    try {
        await loadAll();
        goal.value = status.config.goal || '';
        goalPreset.value = matchPreset(goal.value);
        sliderIdx.value = minToSliderIdx(Math.round((status.config.interval_sec || 300) / 60));
        syncExFormFromAgent();
        if (!status.config.has_keys) activeTab.value = 'agent';

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
    if (poller) clearInterval(poller);
    if (ticker) clearInterval(ticker);
    if (posPoller) clearInterval(posPoller);
    if (marketPoller) clearInterval(marketPoller);
});
</script>

<template>
    <div v-if="selectedDecision" class="flex h-full flex-col bg-bg">
        <header class="flex flex-none items-center gap-2 px-4 pt-4 max-md:px-3 max-md:pt-3">
            <button class="grid h-9 w-9 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-muted transition-colors hover:bg-bg-hi hover:text-ink"
                @click="selectedDecision = null">
                <span class="msi sm">arrow_back</span>
            </button>
            <span class="text-[12px] text-muted">__T_CRYPTOBOT_BACK__</span>
        </header>
        <div class="min-h-0 flex-1 overflow-auto px-8 pb-15 pt-4 max-md:px-4 max-md:pb-10">
            <div class="mb-3 flex items-center gap-2">
                <span class="rounded-md border border-line bg-bg-elev px-1.5 py-px text-[11px] font-medium"
                    :class="selectedDecision.ok ? 'text-good' : 'text-bad'">
                    {{ selectedDecision.ok ? '__T_CRYPTOBOT_TASK_OK__' : '__T_CRYPTOBOT_TASK_FAIL__' }}
                </span>
                <span class="text-[12px] text-faint">#{{ selectedDecision.id }}</span>
                <span class="text-[12px] text-faint">·</span>
                <span class="text-[12px] text-faint">__T_CRYPTOBOT_TASK__ {{ selectedDecision.task_id || '—' }}</span>
            </div>
            <div class="text-[12px] text-faint">{{ fmtTime(selectedDecision.created_at) }}</div>
            <p class="mt-4 whitespace-pre-wrap text-[14px] leading-[1.7] text-ink">{{ selectedDecision.summary || '—' }}</p>
            <div v-if="selectedDecision.error" class="mt-3 rounded-lg px-3 py-2 text-[12px] text-bad"
                style="background:color-mix(in srgb, var(--color-bad) 12%, transparent)">
                {{ selectedDecision.error }}
            </div>
        </div>
    </div>

    <div v-else class="flex h-full flex-col bg-bg">
        <header class="flex flex-none items-end justify-between gap-4 px-8 pb-2 pt-7 max-md:px-4 max-md:pb-2 max-md:pt-5">
            <h1 class="m-0 text-[30px] font-semibold leading-[1.15] tracking-[-0.015em] text-ink max-md:text-[24px]">__T_CRYPTOBOT_TITLE__</h1>
            <div class="flex items-center gap-2 text-[11.5px]">
                <span class="h-1.5 w-1.5 rounded-full" :class="status.state.running ? 'animate-status-pulse bg-good' : 'bg-faint'"></span>
                <span class="text-muted">{{ status.state.running ? '__T_CRYPTOBOT_RUNNING__' : '__T_CRYPTOBOT_STOPPED__' }}</span>
            </div>
        </header>

        <div class="flex-none px-8 pb-4 max-md:px-3">
            <EquityPanel :status="status" />
        </div>

        <nav class="flex flex-none flex-wrap gap-1.5 px-8 pb-3 max-md:px-4">
            <button v-for="t in TABS" :key="t.key"
                class="inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-[12.5px] transition-colors"
                :class="activeTab === t.key ? 'border-transparent bg-blue-bg text-blue-fg' : 'border-line-hi bg-transparent text-muted hover:bg-bg-hi hover:text-ink'"
                @click="activeTab = t.key">
                <span class="msi" style="font-size:14px">{{ t.icon }}</span>
                <span>{{ t.label }}</span>
            </button>
        </nav>

        <div v-if="error" class="mx-8 mb-2 rounded-[10px] px-3.5 py-2 text-[13px] text-bad max-md:mx-4"
            style="background:color-mix(in srgb, var(--color-bad) 12%, transparent)">
            {{ error }}
        </div>

        <div class="min-h-0 flex-1 overflow-auto px-8 pb-15 max-md:px-3 max-md:pb-10">
            <div class="space-y-5">
                <AgentTab v-if="activeTab === 'agent'"
                    :ex-form="exForm"
                    :testing-ex="testingEx"
                    :test-result="testResult"
                    :presets="GOAL_PRESETS"
                    :goal-preset="goalPreset"
                    :goal="goal"
                    :status="status"
                    :can-start="canStart"
                    :countdown-label="countdownLabel"
                    :countdown-progress="countdownProgress"
                    :intervals="INTERVALS"
                    :slider-idx="sliderIdx"
                    @dirty="() => {}"
                    @test-exchange="doTestExchange"
                    @save="doSaveAll"
                    @preset="selectPreset"
                    @update:goal="goal = $event"
                    @start="doStartAgent"
                    @stop="doStopAgent"
                    @slider="onSliderInput" />

                <DecisionsTab v-else-if="activeTab === 'decisions'"
                    :decisions="decisions"
                    :has-more="hasMore"
                    @more="loadMoreDecisions"
                    @select="selectedDecision = $event" />

                <TradingTab v-else-if="activeTab === 'trading'"
                    :inst-type="orderInstType"
                    :orders="orders"
                    :loading="ordersLoading"
                    :error="ordersError"
                    @update:inst-type="orderInstType = $event"
                    @refresh="loadTradeOrders" />

                <PositionsTab v-else-if="activeTab === 'positions'"
                    :data="positionsData"
                    :loading="positionsLoading"
                    :error="positionsError"
                    @refresh="loadPositions" />

                <MarketTab v-else-if="activeTab === 'market'"
                    :items="marketItems"
                    :updated-at="marketUpdatedAt"
                    :loading="marketLoading"
                    :error="marketError"
                    @refresh="loadMarket" />
            </div>
        </div>
    </div>
</template>

<style scoped>
.animate-status-pulse { animation: cb-pulse 1.4s ease-in-out infinite; }
@keyframes cb-pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
</style>
