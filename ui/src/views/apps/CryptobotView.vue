<template>
  <div class="flex h-full flex-col bg-[#0b0e11] font-['Inter','PingFang_SC',system-ui,sans-serif] text-[#eaecef]">

    <!-- 顶栏 -->
    <div class="flex items-center justify-between border-b border-[#2b2f36] bg-[#0b0e11] px-5 py-3">
      <div class="flex items-center gap-3">
        <span class="text-xl font-bold text-[#f0b90b]">₿</span>
        <div>
          <h1 class="text-sm font-bold text-[#eaecef]">{{ t('cryptobot_title') }}</h1>
          <div class="text-[10px] text-[#848e9c]">AI Trading Bot · OKX</div>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <div v-if="status.state.last_price > 0" class="text-right">
          <div class="font-['SF_Mono','Menlo',monospace] text-sm font-bold text-[#eaecef] tabular-nums">{{ fmtNum(status.state.last_price) }}</div>
          <div class="text-[10px] text-[#848e9c]">{{ status.config.inst_id || 'BTC-USDT' }}</div>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="h-1.5 w-1.5 rounded-full" :class="status.state.running ? 'bg-[#0ecb81] shadow-[0_0_6px_#0ecb81]' : 'bg-[#2b2f36]'"></div>
          <span class="text-[11px]" :class="status.state.running ? 'text-[#0ecb81]' : 'text-[#848e9c]'">{{ status.state.running ? t('cryptobot_running') : t('cryptobot_stopped') }}</span>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="border-b border-[#f6465d]/30 bg-[#f6465d]/10 px-5 py-2 text-[11px] text-[#f6465d]">{{ error }}</div>

    <!-- 单列滚动 -->
    <div class="flex-1 overflow-y-auto">
      <div class="mx-auto max-w-[720px] divide-y divide-[#2b2f36]">

        <!-- 账户概览 -->
        <div class="flex flex-wrap items-end gap-x-8 gap-y-3 px-5 py-4">
          <div>
            <div class="mb-1 text-[10px] uppercase tracking-[2px] text-[#848e9c]">{{ t('cryptobot_equity_total') }}</div>
            <div class="font-['SF_Mono','Menlo',monospace] text-[30px] font-bold leading-none tabular-nums text-[#eaecef]">
              {{ fmtNum(status.equity.current, 0) }}<span class="ml-1 text-sm font-normal text-[#848e9c]">USDT</span>
            </div>
          </div>
          <div>
            <div class="mb-1 text-[10px] uppercase tracking-[2px] text-[#848e9c]">{{ t('cryptobot_pnl_total') }}</div>
            <div class="font-['SF_Mono','Menlo',monospace] text-xl font-bold tabular-nums" :class="status.equity.pnl >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'">
              {{ status.equity.pnl >= 0 ? '+' : '' }}{{ fmtNum(status.equity.pnl) }}
              <span class="text-[12px] font-normal opacity-80">({{ status.equity.pnl_ratio >= 0 ? '+' : '' }}{{ fmtNum(status.equity.pnl_ratio, 1) }}%)</span>
            </div>
          </div>
          <div class="text-[11px] text-[#848e9c]">{{ t('cryptobot_initial', { v: fmtNum(status.equity.initial, 0) }) }} USDT</div>
          <div v-if="status.state.running" class="ml-auto text-right text-[11px] text-[#848e9c]">
            <div>{{ t('cryptobot_ticks', { n: status.state.tick_count }) }}</div>
            <div>{{ t('cryptobot_trades', { n: status.state.trade_count }) }} · {{ runDuration }}</div>
          </div>
        </div>

        <!-- 权益曲线 -->
        <div class="px-5 py-4">
          <div class="mb-2 text-[10px] uppercase tracking-[2px] text-[#848e9c]">{{ t('cryptobot_equity_curve') }}</div>
          <svg viewBox="0 0 580 100" class="h-[100px] w-full">
            <line v-for="y in [25, 50, 75]" :key="y" x1="0" :y1="y" x2="580" :y2="y" stroke="#2b2f36" stroke-width="1"/>
            <defs>
              <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" :stop-color="eqColor" stop-opacity="0.15"/>
                <stop offset="100%" :stop-color="eqColor" stop-opacity="0"/>
              </linearGradient>
            </defs>
            <polygon v-if="eqPolyline" :points="eqFillPts" fill="url(#eqFill)" />
            <polyline v-if="eqPolyline" fill="none" :stroke="eqColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" :points="eqPolyline" />
            <template v-for="dot in tradeDots" :key="dot.id">
              <circle :cx="dot.x" :cy="dot.y" r="3" :fill="dot.action === 'buy' ? '#0ecb81' : '#f6465d'" />
            </template>
            <text v-if="!eqPolyline" x="290" y="55" text-anchor="middle" fill="#4b5563" font-size="12">{{ t('cryptobot_no_data') }}</text>
          </svg>
          <div class="mt-1 flex justify-between text-[10px] text-[#848e9c]">
            <span><span class="text-[#0ecb81]">●</span> {{ t('cryptobot_buy') }} <span class="ml-2 text-[#f6465d]">●</span> {{ t('cryptobot_sell') }}</span>
            <span v-if="eqTimespan">{{ t('cryptobot_recent') }} {{ eqTimespan }}</span>
          </div>
        </div>

        <!-- 自动运行 -->
        <div class="px-5 py-4">
          <div class="mb-3 text-[10px] uppercase tracking-[2px] text-[#848e9c]">{{ t('cryptobot_auto_run') }}</div>
          <div class="flex items-center gap-3">
            <span class="text-[11px] text-[#848e9c]">{{ t('cryptobot_interval') }}</span>
            <select v-model="intervalMin" class="rounded border border-[#2b2f36] bg-[#1c2026] px-2 py-1 text-[11px] text-[#eaecef] outline-none" @change="onIntervalChange">
              <option v-for="m in [1,2,3,5,10,15,30,60]" :key="m" :value="m">{{ t('cryptobot_minutes', { n: m }) }}</option>
            </select>
            <button v-if="status.state.running" @click="doStop" class="btn-danger ml-auto">{{ t('cryptobot_stop') }}</button>
            <button v-else @click="doStart" class="btn-success ml-auto">{{ t('cryptobot_start') }}</button>
          </div>
        </div>

        <!-- 交易所配置 -->
        <div class="px-5 py-4">
          <div class="flex items-center gap-3">
            <div class="text-[10px] uppercase tracking-[2px] text-[#848e9c]">{{ t('cryptobot_exchange') }}</div>
            <span class="text-[11px] font-bold text-[#eaecef]">OKX</span>
            <span v-if="status.config.has_keys" class="rounded bg-[#0ecb81]/10 px-2 py-0.5 text-[9px] font-bold text-[#0ecb81]">{{ t('cryptobot_connected') }}</span>
            <span v-else class="rounded bg-[#2b2f36] px-2 py-0.5 text-[9px] font-bold text-[#848e9c]">{{ t('cryptobot_not_configured') }}</span>
            <span v-if="status.config.api_key" class="font-['SF_Mono','Menlo',monospace] text-[10px] text-[#848e9c]">{{ status.config.api_key }}</span>
            <button class="ml-auto text-[11px] text-[#848e9c] hover:text-[#eaecef]" @click="showExPanel = !showExPanel">{{ showExPanel ? t('cryptobot_collapse') : t('cryptobot_edit') }}</button>
          </div>
          <div v-if="showExPanel" class="mt-3 grid grid-cols-2 gap-2">
            <input v-model="exForm.api_key" placeholder="API Key" class="ex-input" />
            <input v-model="exForm.api_secret" type="password" placeholder="API Secret" class="ex-input" />
            <input v-model="exForm.passphrase" type="password" placeholder="Passphrase" class="ex-input" />
            <input v-model="exForm.base_url" :placeholder="t('cryptobot_api_url_placeholder')" class="ex-input" />
            <div class="col-span-2 flex items-center justify-between pt-1">
              <div class="flex items-center gap-2">
                <button class="btn-ghost" :disabled="testingEx" @click="doTestExchange">{{ testingEx ? t('cryptobot_testing') : t('cryptobot_test_connection') }}</button>
                <span v-if="testResult" class="text-[11px]" :class="testResult.ok ? 'text-[#0ecb81]' : 'text-[#f6465d]'">{{ testResult.msg }}</span>
              </div>
              <button class="btn-primary" @click="doSaveExchange">{{ t('common_save') }}</button>
            </div>
          </div>
        </div>

        <!-- 交易指令 -->
        <div class="px-5 py-4">
          <div class="mb-2 text-[10px] uppercase tracking-[2px] text-[#848e9c]">{{ t('cryptobot_directive') }}</div>
          <textarea
            v-model="directive"
            class="dir-area"
            rows="3"
            :placeholder="t('cryptobot_directive_placeholder')"
          ></textarea>
          <div class="mt-2 flex items-center justify-between">
            <span class="text-[10px] text-[#848e9c]">{{ status.config.updated_at ? t('cryptobot_last_saved', { t: fmtTime(status.config.updated_at) }) : '' }}</span>
            <button class="btn-primary" @click="doSaveDirective">{{ t('common_save') }}</button>
          </div>
        </div>

        <!-- 运行记录 -->
        <div class="px-5 pt-4">
          <div class="mb-3 text-[10px] uppercase tracking-[2px] text-[#848e9c]">{{ t('cryptobot_logs') }}</div>
        </div>
        <div v-if="!decisions.length" class="py-10 text-center text-[13px] text-[#4b5563]">{{ t('cryptobot_logs_empty') }}</div>
        <div v-for="(d, idx) in decisions" :key="d.id" class="flex gap-3 px-5">
          <div class="w-10 flex-shrink-0 pt-3.5 text-right">
            <span class="font-['SF_Mono','Menlo',monospace] text-[11px] tabular-nums text-[#4b5563]">{{ fmtShort(d.created_at) }}</span>
          </div>
          <div class="flex w-3.5 flex-shrink-0 flex-col items-center">
            <div class="mt-3.5 h-2 w-2 flex-shrink-0 rounded-full" :class="dotCls(d.action)"></div>
            <div v-if="idx < decisions.length - 1" class="w-px flex-1 bg-[#2b2f36]"></div>
          </div>
          <div class="min-w-0 flex-1 pb-4 pt-2.5">
            <div class="text-[11px] font-bold uppercase tracking-wider" :class="actCls(d.action)">{{ actLabel(d.action) }}</div>
            <div class="mt-1 text-[13px] leading-relaxed text-[#848e9c]">{{ d.reason }}</div>
            <div v-if="d.action !== 'hold' && d.amount_usdt > 0" class="mt-2 inline-flex items-center gap-1.5 rounded border border-[#2b2f36] bg-[#141518] px-2.5 py-1 font-['SF_Mono','Menlo',monospace] text-[11px] tabular-nums text-[#848e9c]">
              <span>{{ status.config.inst_id }}</span>
              <span class="text-[#eaecef] font-bold">{{ fmtNum(d.price) }}</span>
              <span>×</span>
              <span>{{ Number(d.size_coin).toFixed(6) }}</span>
              <span>=</span>
              <span class="font-bold" :class="d.action === 'buy' ? 'text-[#0ecb81]' : 'text-[#f6465d]'">{{ fmtNum(d.amount_usdt) }} U</span>
            </div>
          </div>
        </div>
        <div v-if="hasMore" class="cursor-pointer py-4 text-center text-[11px] text-[#848e9c] hover:text-[#eaecef]" @click="loadMoreDecisions">{{ t('cryptobot_load_more') }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { useI18n } from '../../i18n/index.js';

const { t } = useI18n();

const API = '/apps/cryptobot';

const error = ref('');
let poller = null;

const status = reactive({
  config: { api_key: '', has_keys: false, directive: '', interval_sec: 300, inst_id: 'BTC-USDT', updated_at: '', base_url: '' },
  state: { running: false, tick_count: 0, trade_count: 0, started_at: '', last_run_at: '', last_price: 0 },
  equity: { current: 10000, initial: 10000, pnl: 0, pnl_ratio: 0, today_change: 0 }
});

const showExPanel = ref(false);
const exForm = reactive({ api_key: '', api_secret: '', passphrase: '', base_url: '' });
const testingEx = ref(false);
const testResult = ref(null);
const directive = ref('');
const intervalMin = ref(5);
const decisions = ref([]);
const equityPts = ref([]);
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

const loadDecisions = async () => {
  const d = await api(`/decisions?limit=${decisionLimit.value}`);
  const items = d.items || [];
  decisions.value = items;
  hasMore.value = items.length >= decisionLimit.value;
};

const loadEquity = async () => {
  const d = await api('/equity?limit=300');
  equityPts.value = d.points || [];
};

const loadAll = () => Promise.all([loadStatus(), loadDecisions(), loadEquity()]);

const loadMoreDecisions = () => {
  decisionLimit.value += 50;
  loadDecisions();
};

const doTestExchange = async () => {
  testingEx.value = true;
  testResult.value = null;
  try {
    await post('/exchange/test', exForm);
    testResult.value = { ok: true, msg: t('cryptobot_test_success') };
  } catch (e) {
    testResult.value = { ok: false, msg: e.message };
  } finally {
    testingEx.value = false;
  }
};

const doSaveExchange = async () => {
  error.value = '';
  try {
    await post('/exchange', exForm);
    showExPanel.value = false;
    testResult.value = null;
    exForm.api_key = ''; exForm.api_secret = ''; exForm.passphrase = '';
    await loadStatus();
  } catch (e) { error.value = e.message; }
};

const doSaveDirective = async () => {
  error.value = '';
  try {
    await post('/directive', { directive: directive.value });
    await loadStatus();
  } catch (e) { error.value = e.message; }
};

const doStart = async () => {
  error.value = '';
  try {
    await post('/start', { interval_sec: intervalMin.value * 60 });
    await loadAll();
  } catch (e) { error.value = e.message; }
};

const doStop = async () => {
  error.value = '';
  try {
    await post('/stop');
    await loadAll();
  } catch (e) { error.value = e.message; }
};

const onIntervalChange = () => {
  if (status.state.running) doStart();
};

const eqColor = computed(() => status.equity.pnl >= 0 ? '#4a9a40' : '#c04030');

const runDuration = computed(() => {
  if (!status.state.started_at) return '';
  const ms = Date.now() - new Date(status.state.started_at).getTime();
  if (ms < 0) return '';
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return t('cryptobot_minutes', { n: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t('cryptobot_hours', { n: hours });
  return t('cryptobot_days', { n: Math.floor(hours / 24) });
});

const eqPolyline = computed(() => {
  const pts = equityPts.value;
  if (pts.length < 2) return '';
  const vals = pts.map(p => Number(p.equity)).filter(Number.isFinite);
  if (vals.length < 2) return '';
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  return pts.map((p, i) => {
    const x = (i / (pts.length - 1)) * 580;
    const y = 5 + (1 - (Number(p.equity) - min) / span) * 110;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
});

const eqFillPts = computed(() => eqPolyline.value ? `0,115 ${eqPolyline.value} 580,115` : '');

const tradeDots = computed(() => {
  const pts = equityPts.value;
  if (pts.length < 2) return [];
  const vals = pts.map(p => Number(p.equity));
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  return decisions.value
    .filter(d => d.action === 'buy' || d.action === 'sell')
    .map(d => {
      const dTime = new Date(d.created_at).getTime();
      let closest = 0;
      let minDiff = Infinity;
      pts.forEach((p, i) => {
        const diff = Math.abs(new Date(p.created_at).getTime() - dTime);
        if (diff < minDiff) { minDiff = diff; closest = i; }
      });
      const x = (closest / (pts.length - 1)) * 580;
      const y = 5 + (1 - (vals[closest] - min) / span) * 110;
      return { id: d.id, x: x.toFixed(1), y: y.toFixed(1), action: d.action };
    })
    .slice(0, 20);
});

const eqTimespan = computed(() => {
  const pts = equityPts.value;
  if (pts.length < 2) return '';
  const first = new Date(pts[0].created_at).getTime();
  const last = new Date(pts[pts.length - 1].created_at).getTime();
  const hours = Math.round((last - first) / 3600000);
  if (hours <= 0) return '';
  if (hours < 24) return t('cryptobot_hours', { n: hours });
  return t('cryptobot_days', { n: Math.round(hours / 24) });
});

const fmtNum = (v, dec = 2) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return '-';
  return n.toLocaleString('en-US', { maximumFractionDigits: dec });
};

const fmtTime = (v) => {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const fmtShort = (v) => {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d.getTime())) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const dotCls = (a) => ({
  'bg-[#2a7a3a]': a === 'buy',
  'bg-[#c04030]': a === 'sell',
  'border-2 border-[#d4c4b0] bg-transparent': a !== 'buy' && a !== 'sell'
});

const actCls = (a) => ({
  'text-[#2a7a3a]': a === 'buy',
  'text-[#c04030]': a === 'sell',
  'text-[#b0a090]': a !== 'buy' && a !== 'sell'
});

const actLabel = (a) => {
  if (a === 'buy') return t('cryptobot_buy');
  if (a === 'sell') return t('cryptobot_sell');
  return t('cryptobot_hold');
};

onMounted(async () => {
  try {
    await loadAll();
    directive.value = status.config.directive || '';
    intervalMin.value = Math.round((status.config.interval_sec || 300) / 60);
    exForm.base_url = status.config.base_url || 'https://www.okx.com';
    poller = setInterval(() => loadAll().catch(() => {}), 5000);
  } catch (e) {
    error.value = e.message || t('cryptobot_init_failed');
  }
});

onUnmounted(() => {
  if (poller) { clearInterval(poller); poller = null; }
});
</script>

<style scoped>
.ex-input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #2b2f36;
  border-radius: 6px;
  font-size: 11px;
  font-family: inherit;
  outline: none;
  background: #1c2026;
  color: #eaecef;
}
.ex-input::placeholder { color: #4b5563; }
.ex-input:focus { border-color: #3d8eff; }
.btn-primary {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  border: none;
  background: #3d8eff;
  color: #fff;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}
.btn-primary:hover { background: #5a9fff; }
.btn-success {
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  border: none;
  background: #0ecb81;
  color: #0b0e11;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}
.btn-success:hover { background: #20d990; }
.btn-danger {
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  border: 1px solid #f6465d;
  background: transparent;
  color: #f6465d;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}
.btn-danger:hover { background: #f6465d18; }
.btn-ghost {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  border: 1px solid #2b2f36;
  background: transparent;
  color: #848e9c;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}
.btn-ghost:hover { border-color: #848e9c; color: #eaecef; }
.btn-ghost:disabled { opacity: 0.4; cursor: not-allowed; }
.dir-area {
  width: 100%;
  border: 1px solid #2b2f36;
  border-radius: 6px;
  background: #1c2026;
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.8;
  font-family: inherit;
  color: #eaecef;
  resize: none;
  outline: none;
}
.dir-area:focus { border-color: #3d8eff; }
.dir-area::placeholder { color: #4b5563; font-size: 12px; }
</style>
