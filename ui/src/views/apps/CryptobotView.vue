<template>
  <div class="flex h-full flex-col bg-[#0c0f14] font-['SF_Mono','Menlo','Monaco',monospace] text-[#e0e4ea]">

    <!-- 顶栏：ticker + 状态 -->
    <div class="flex items-center justify-between border-b border-[#1e2530] bg-[#111419] px-5 py-2.5">
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <span class="text-base font-bold text-[#f0b90b]">₿</span>
          <span class="text-[15px] font-bold tracking-wide">{{ status.config.inst_id || 'BTC-USDT' }}</span>
        </div>
        <div class="text-[22px] font-bold tabular-nums">
          {{ status.state.last_price ? fmtNum(status.state.last_price, 2) : '--' }}
        </div>
        <div class="text-[13px] font-semibold tabular-nums" :class="status.equity.today_change >= 0 ? 'text-[#00c076]' : 'text-[#f6465d]'">
          {{ status.equity.today_change >= 0 ? '+' : '' }}{{ fmtNum(status.equity.today_change) }} U
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-1.5">
          <div class="h-[7px] w-[7px] rounded-full" :class="status.state.running ? 'bg-[#00c076] shadow-[0_0_6px_rgba(0,192,118,0.4)]' : 'bg-[#3a3f4a]'"></div>
          <span class="text-[11px] text-[#6b7280]">{{ status.state.running ? 'RUNNING' : 'STOPPED' }}</span>
        </div>
        <div class="flex items-center gap-1 text-[11px] text-[#6b7280]">
          <select v-model="intervalMin" class="rounded border border-[#1e2530] bg-[#0c0f14] px-1.5 py-0.5 text-[11px] text-[#e0e4ea] outline-none" @change="onIntervalChange">
            <option v-for="m in [1,2,3,5,10,15,30,60]" :key="m" :value="m">{{ m }}m</option>
          </select>
        </div>
        <button v-if="status.state.running" @click="doStop" class="rounded bg-[#f6465d]/10 px-3 py-1 text-[11px] font-bold text-[#f6465d] transition hover:bg-[#f6465d]/20">STOP</button>
        <button v-else @click="doStart" class="rounded bg-[#00c076]/10 px-3 py-1 text-[11px] font-bold text-[#00c076] transition hover:bg-[#00c076]/20">START</button>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="border-b border-[#f6465d]/20 bg-[#f6465d]/5 px-5 py-2 text-[11px] text-[#f6465d]">{{ error }}</div>

    <div class="flex min-h-0 flex-1">
      <!-- 左侧：图表 + 决策 -->
      <div class="flex min-w-0 flex-1 flex-col">

        <!-- 账户概览 -->
        <div class="flex items-end gap-6 border-b border-[#1e2530] px-5 py-3">
          <div>
            <div class="text-[10px] uppercase tracking-[2px] text-[#4a5060]">Equity</div>
            <div class="mt-0.5 text-[28px] font-bold leading-none tabular-nums">{{ fmtNum(status.equity.current, 0) }}<span class="ml-1 text-sm font-normal text-[#4a5060]">U</span></div>
          </div>
          <div>
            <div class="text-[10px] uppercase tracking-[2px] text-[#4a5060]">P&L</div>
            <div class="mt-0.5 text-lg font-bold tabular-nums" :class="status.equity.pnl >= 0 ? 'text-[#00c076]' : 'text-[#f6465d]'">
              {{ status.equity.pnl >= 0 ? '+' : '' }}{{ fmtNum(status.equity.pnl) }}
              <span class="text-[11px] font-normal">({{ status.equity.pnl_ratio >= 0 ? '+' : '' }}{{ fmtNum(status.equity.pnl_ratio, 1) }}%)</span>
            </div>
          </div>
          <div v-if="status.state.running" class="text-[11px] text-[#4a5060]">
            {{ status.state.tick_count }} ticks · {{ status.state.trade_count }} trades · {{ runDuration }}
          </div>
        </div>

        <!-- 权益曲线 -->
        <div class="border-b border-[#1e2530] px-5 py-3">
          <svg viewBox="0 0 580 120" class="h-[120px] w-full">
            <line v-for="y in [30, 60, 90]" :key="y" x1="0" :y1="y" x2="580" :y2="y" stroke="#1e2530" stroke-width="1"/>
            <defs>
              <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" :stop-color="eqColor" stop-opacity="0.15"/>
                <stop offset="100%" :stop-color="eqColor" stop-opacity="0"/>
              </linearGradient>
            </defs>
            <polygon v-if="eqPolyline" :points="eqFillPts" fill="url(#eqFill)" />
            <polyline v-if="eqPolyline" fill="none" :stroke="eqColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" :points="eqPolyline" />
            <template v-for="dot in tradeDots" :key="dot.id">
              <circle :cx="dot.x" :cy="dot.y" r="3" :fill="dot.action === 'buy' ? '#00c076' : '#f6465d'" />
            </template>
            <text v-if="!eqPolyline" x="290" y="65" text-anchor="middle" fill="#2a3040" font-size="12" font-family="inherit">NO DATA</text>
          </svg>
          <div class="mt-1 flex justify-between text-[10px] text-[#3a4050]">
            <span><span class="text-[#00c076]">●</span> BUY <span class="ml-2 text-[#f6465d]">●</span> SELL</span>
            <span v-if="eqTimespan">{{ eqTimespan }}</span>
          </div>
        </div>

        <!-- 运行记录 -->
        <div class="min-h-0 flex-1 overflow-y-auto">
          <div class="px-5 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[2px] text-[#3a4050]">Decisions</div>
          <div v-if="!decisions.length" class="px-5 py-8 text-center text-[12px] text-[#2a3040]">启动后，AI 的每次思考和决策会显示在这里</div>
          <div v-for="(d, idx) in decisions" :key="d.id" class="flex gap-3 px-5">
            <div class="w-10 flex-shrink-0 pt-3 text-right">
              <span class="text-[10px] tabular-nums text-[#3a4050]">{{ fmtShort(d.created_at) }}</span>
            </div>
            <div class="flex w-3 flex-shrink-0 flex-col items-center">
              <div class="mt-3 h-2 w-2 flex-shrink-0 rounded-full" :class="dotCls(d.action)"></div>
              <div v-if="idx < decisions.length - 1" class="w-px flex-1 bg-[#1e2530]"></div>
            </div>
            <div class="min-w-0 flex-1 pb-3.5 pt-2">
              <div class="text-[10px] font-bold uppercase tracking-[1px]" :class="actCls(d.action)">{{ actLabel(d.action) }}</div>
              <div class="mt-0.5 text-[12px] font-sans leading-[1.7] text-[#8a90a0]">{{ d.reason }}</div>
              <div v-if="d.action !== 'hold' && d.amount_usdt > 0" class="mt-1 inline-block rounded bg-[#141820] px-2 py-0.5 text-[10px] tabular-nums text-[#6b7280]">
                {{ status.config.inst_id }} <span class="text-[#e0e4ea]">{{ fmtNum(d.price) }}</span> × {{ Number(d.size_coin).toFixed(6) }} = <span class="text-[#e0e4ea]">{{ fmtNum(d.amount_usdt) }} U</span>
              </div>
            </div>
          </div>
          <div v-if="hasMore" class="cursor-pointer py-3 text-center text-[11px] text-[#3a4050] hover:text-[#6b7280]" @click="loadMoreDecisions">LOAD MORE ↓</div>
        </div>
      </div>

      <!-- 右侧面板 -->
      <div class="flex w-[280px] flex-shrink-0 flex-col gap-0 border-l border-[#1e2530]">

        <!-- 交易所连接 -->
        <div class="border-b border-[#1e2530] p-4">
          <div class="mb-2.5 flex items-center justify-between">
            <div class="text-[10px] font-bold uppercase tracking-[2px] text-[#3a4050]">Exchange</div>
            <span class="cursor-pointer text-[10px] text-[#4a5060] hover:text-[#e0e4ea]" @click="showExPanel = !showExPanel">{{ showExPanel ? 'CLOSE' : 'EDIT' }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[13px] font-bold">OKX</span>
            <span v-if="status.config.has_keys" class="rounded bg-[#00c076]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#00c076]">CONNECTED</span>
            <span v-else class="rounded bg-[#f6465d]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#f6465d]">NO KEY</span>
          </div>
          <div v-if="status.config.api_key" class="mt-1 text-[10px] text-[#3a4050]">{{ status.config.api_key }}</div>
          <div v-if="showExPanel" class="mt-3 space-y-2">
            <input v-model="exForm.api_key" placeholder="API Key" class="term-input" />
            <input v-model="exForm.api_secret" type="password" placeholder="API Secret" class="term-input" />
            <input v-model="exForm.passphrase" type="password" placeholder="Passphrase" class="term-input" />
            <input v-model="exForm.base_url" placeholder="API URL" class="term-input" />
            <div class="flex items-center justify-between pt-1">
              <div class="flex items-center gap-1.5">
                <button class="term-btn-outline" :disabled="testingEx" @click="doTestExchange">{{ testingEx ? '...' : 'TEST' }}</button>
                <span v-if="testResult" class="text-[10px]" :class="testResult.ok ? 'text-[#00c076]' : 'text-[#f6465d]'">{{ testResult.msg }}</span>
              </div>
              <button class="term-btn" @click="doSaveExchange">SAVE</button>
            </div>
          </div>
        </div>

        <!-- 交易指令 -->
        <div class="flex min-h-0 flex-1 flex-col border-b border-[#1e2530] p-4">
          <div class="mb-2.5 text-[10px] font-bold uppercase tracking-[2px] text-[#3a4050]">Directive</div>
          <textarea
            v-model="directive"
            class="term-textarea flex-1"
            placeholder="告诉 AI 你想怎么交易...&#10;&#10;例如：帮我盯 BTC，保守操作，单次不超过 50U，跌 5% 止损。"
          ></textarea>
          <div class="mt-2 flex items-center justify-between">
            <span class="text-[10px] text-[#2a3040]">{{ status.config.updated_at ? fmtTime(status.config.updated_at) : '' }}</span>
            <button class="term-btn" @click="doSaveDirective">SAVE</button>
          </div>
        </div>

        <!-- 快速信息 -->
        <div class="p-4">
          <div class="mb-2 text-[10px] font-bold uppercase tracking-[2px] text-[#3a4050]">Stats</div>
          <div class="space-y-1.5 text-[11px]">
            <div class="flex justify-between"><span class="text-[#4a5060]">Initial</span><span class="tabular-nums">{{ fmtNum(status.equity.initial, 0) }} U</span></div>
            <div class="flex justify-between"><span class="text-[#4a5060]">Current</span><span class="tabular-nums">{{ fmtNum(status.equity.current, 0) }} U</span></div>
            <div class="flex justify-between"><span class="text-[#4a5060]">Today</span><span class="tabular-nums" :class="status.equity.today_change >= 0 ? 'text-[#00c076]' : 'text-[#f6465d]'">{{ status.equity.today_change >= 0 ? '+' : '' }}{{ fmtNum(status.equity.today_change) }} U</span></div>
            <div class="flex justify-between"><span class="text-[#4a5060]">Ticks</span><span class="tabular-nums">{{ status.state.tick_count }}</span></div>
            <div class="flex justify-between"><span class="text-[#4a5060]">Trades</span><span class="tabular-nums">{{ status.state.trade_count }}</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';

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
    testResult.value = { ok: true, msg: '✓ OK' };
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

const eqColor = computed(() => status.equity.pnl >= 0 ? '#00c076' : '#f6465d');

const runDuration = computed(() => {
  if (!status.state.started_at) return '';
  const ms = Date.now() - new Date(status.state.started_at).getTime();
  if (ms < 0) return '';
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
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
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
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
  'bg-[#00c076]': a === 'buy',
  'bg-[#f6465d]': a === 'sell',
  'border border-[#2a3040] bg-transparent': a !== 'buy' && a !== 'sell'
});

const actCls = (a) => ({
  'text-[#00c076]': a === 'buy',
  'text-[#f6465d]': a === 'sell',
  'text-[#3a4050]': a !== 'buy' && a !== 'sell'
});

const actLabel = (a) => {
  if (a === 'buy') return 'BUY';
  if (a === 'sell') return 'SELL';
  return 'HOLD';
};

onMounted(async () => {
  try {
    await loadAll();
    directive.value = status.config.directive || '';
    intervalMin.value = Math.round((status.config.interval_sec || 300) / 60);
    exForm.base_url = status.config.base_url || 'https://www.okx.com';
    poller = setInterval(() => loadAll().catch(() => {}), 5000);
  } catch (e) {
    error.value = e.message || '初始化失败';
  }
});

onUnmounted(() => {
  if (poller) { clearInterval(poller); poller = null; }
});
</script>

<style scoped>
.term-input {
  width: 100%;
  padding: 5px 8px;
  border: 1px solid #1e2530;
  border-radius: 4px;
  font-size: 11px;
  font-family: 'SF Mono', Menlo, Monaco, monospace;
  outline: none;
  background: #0c0f14;
  color: #e0e4ea;
}
.term-input:focus { border-color: #3a4050; }
.term-input::placeholder { color: #2a3040; }
.term-btn {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  border: none;
  background: #f0b90b;
  color: #0c0f14;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}
.term-btn:hover { background: #fcd535; }
.term-btn-outline {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  border: 1px solid #2a3040;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}
.term-btn-outline:hover { border-color: #4a5060; color: #e0e4ea; }
.term-btn-outline:disabled { opacity: 0.4; cursor: not-allowed; }
.term-textarea {
  width: 100%;
  border: 1px solid #1e2530;
  border-radius: 4px;
  background: #0c0f14;
  padding: 8px 10px;
  font-size: 12px;
  line-height: 1.7;
  font-family: 'PingFang SC', 'SF Mono', sans-serif;
  color: #e0e4ea;
  resize: none;
  outline: none;
  min-height: 60px;
}
.term-textarea:focus { border-color: #3a4050; }
.term-textarea::placeholder { color: #2a3040; font-size: 11px; }
</style>
