<template>
  <div class="h-full w-full overflow-y-auto bg-[#f5f0e8] text-[#3a2e20]" style="font-family: Georgia, 'Noto Serif SC', serif">
    <div class="mx-auto w-full max-w-[620px] px-4 py-8">

      <!-- Header -->
      <div class="mb-6 border-b-2 border-[#3a2e20] pb-3 text-center">
        <h1 class="text-[28px] font-black">炒币机</h1>
        <div class="mt-1 text-[11px] tracking-wider text-[#9a8a70]">AI 盯盘 · 自动交易</div>
      </div>

      <!-- Error -->
      <div v-if="error" class="mb-4 rounded-xl border border-[#e0b8a0] bg-[#fdf5ef] px-3 py-2 text-xs text-[#c05030]">{{ error }}</div>

      <!-- 1. Exchange bar -->
      <div class="mb-4 flex items-center justify-between rounded-xl border border-[#ddd2c2] bg-[#fffdf8] px-3.5 py-2.5">
        <div class="flex items-center gap-2">
          <span class="text-sm font-extrabold">OKX</span>
          <span v-if="status.config.has_keys" class="rounded-md bg-[#d8f0d0] px-2 py-0.5 text-[9px] font-bold text-[#2a7030]">已连接</span>
          <span v-else class="rounded-md bg-[#ece4d8] px-2 py-0.5 text-[9px] font-bold text-[#9a8a70]">未配置</span>
          <span v-if="status.config.api_key" class="text-[10px] text-[#b0a088]">{{ status.config.api_key }}</span>
        </div>
        <span class="cursor-pointer text-[11px] text-[#8a7a60] underline decoration-dotted underline-offset-2 hover:text-[#4a3a20]" @click="showExPanel = !showExPanel">修改</span>
      </div>

      <!-- Exchange panel -->
      <div v-if="showExPanel" class="-mt-2 mb-4 rounded-xl border border-[#ddd2c2] bg-[#fffdf8] p-3.5">
        <div class="grid grid-cols-3 gap-2">
          <input v-model="exForm.api_key" placeholder="API Key" class="ex-input" />
          <input v-model="exForm.api_secret" type="password" placeholder="API Secret" class="ex-input" />
          <input v-model="exForm.passphrase" type="password" placeholder="Passphrase" class="ex-input" />
        </div>
        <input v-model="exForm.base_url" placeholder="API URL（默认 https://www.okx.com）" class="ex-input mt-2 !w-full" />
        <div class="mt-2.5 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <button class="btn-ghost" :disabled="testingEx" @click="doTestExchange">{{ testingEx ? '测试中...' : '测试连接' }}</button>
            <span v-if="testResult" class="text-[11px]" :class="testResult.ok ? 'text-[#2a7030]' : 'text-[#c05030]'">{{ testResult.msg }}</span>
          </div>
          <button class="btn-dark" @click="doSaveExchange">保存</button>
        </div>
      </div>

      <!-- 2. Run status -->
      <div class="mb-4 rounded-xl border border-[#ddd2c2] bg-[#fffdf8] p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="h-[9px] w-[9px] flex-shrink-0 rounded-full" :class="status.state.running ? 'bg-[#4a9a40] shadow-[0_0_8px_rgba(74,154,64,0.35)]' : 'bg-[#c0b098]'"></div>
            <div>
              <div class="text-sm font-extrabold">{{ status.state.running ? '运行中' : '已停止' }}</div>
              <div v-if="status.state.running" class="mt-0.5 text-[11px] text-[#9a8a70]">
                已思考 {{ status.state.tick_count }} 次 · 交易 {{ status.state.trade_count }} 笔 · 运行 {{ runDuration }}
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <div class="flex items-center gap-1 text-[11px] text-[#6a5a44]">
              每
              <select v-model="intervalMin" class="rounded-md border border-[#e0d8cc] bg-white px-1.5 py-1 text-[11px] outline-none" @change="onIntervalChange">
                <option v-for="m in [1,2,3,5,10,15,30,60]" :key="m" :value="m">{{ m }}</option>
              </select>
              分钟
            </div>
            <button v-if="status.state.running" class="btn-stop" @click="doStop">停止</button>
            <button v-else class="btn-dark" @click="doStart">启动</button>
          </div>
        </div>
      </div>

      <!-- 3. Directive -->
      <div class="mb-4 rounded-xl border border-[#ddd2c2] bg-[#fffdf8] p-4">
        <div class="mb-2 text-[10px] font-bold uppercase tracking-[2px] text-[#a09078]">交易指令</div>
        <textarea
          v-model="directive"
          class="dir-area"
          placeholder="告诉 AI 你想怎么交易...&#10;&#10;例如：帮我盯 BTC，保守操作，单次不超过 50U，跌 5% 止损。"
        ></textarea>
        <div class="mt-2 flex items-center justify-between">
          <span class="text-[10px] text-[#b0a088]">{{ status.config.updated_at ? `上次保存 ${fmtTime(status.config.updated_at)}` : '' }}</span>
          <button class="btn-dark" @click="doSaveDirective">保存</button>
        </div>
      </div>

      <!-- 4. Account balance -->
      <div class="mb-4 rounded-xl border border-[#ddd2c2] bg-[#fffdf8] p-4">
        <div class="mb-2.5 text-[10px] font-bold uppercase tracking-[2px] text-[#a09078]">账户余额</div>
        <div class="mb-3 flex items-baseline justify-between">
          <div>
            <span class="font-mono text-[32px] font-black">{{ fmtNum(status.equity.current, 0) }}</span>
            <span class="ml-1 text-sm text-[#9a8a70]">U</span>
          </div>
          <div class="text-[13px] font-bold" :class="status.equity.today_change >= 0 ? 'text-[#2a7a3a]' : 'text-[#c04030]'">
            今日 {{ status.equity.today_change >= 0 ? '+' : '' }}{{ fmtNum(status.equity.today_change) }}
          </div>
        </div>
        <svg viewBox="0 0 580 100" class="h-[80px] w-full">
          <line x1="0" y1="25" x2="580" y2="25" stroke="#ece4d8" stroke-width="1"/>
          <line x1="0" y1="50" x2="580" y2="50" stroke="#ece4d8" stroke-width="1"/>
          <line x1="0" y1="75" x2="580" y2="75" stroke="#ece4d8" stroke-width="1"/>
          <defs>
            <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" :stop-color="eqColor" stop-opacity="0.1"/>
              <stop offset="100%" :stop-color="eqColor" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <polygon v-if="eqPolyline" :points="eqFillPts" fill="url(#eqFill)" />
          <polyline v-if="eqPolyline" fill="none" :stroke="eqColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :points="eqPolyline" />
          <template v-for="dot in tradeDots" :key="dot.id">
            <circle :cx="dot.x" :cy="dot.y" r="3.5" :fill="dot.action === 'buy' ? '#2a7a3a' : '#c04030'" />
          </template>
          <text v-if="!eqPolyline" x="290" y="55" text-anchor="middle" fill="#b8a890" font-size="12">暂无数据</text>
        </svg>
        <div class="mt-1.5 flex justify-between text-[10px] text-[#b0a088]">
          <span><span class="text-[#2a7a3a]">●</span> 买入 <span class="text-[#c04030]">●</span> 卖出</span>
          <span v-if="eqTimespan">最近 {{ eqTimespan }}</span>
        </div>
      </div>

      <!-- 5. AI Thinking Timeline -->
      <div class="mb-2.5 text-[10px] font-bold uppercase tracking-[2px] text-[#a09078]">运行记录</div>

      <div v-if="!decisions.length" class="py-8 text-center text-[13px] text-[#b0a090]">启动后，AI 的每次思考和决策会显示在这里</div>

      <div v-for="(d, idx) in decisions" :key="d.id" class="flex gap-3">
        <div class="w-10 flex-shrink-0 pt-3.5 text-right">
          <span class="text-[11px] font-semibold text-[#b0a088]">{{ fmtShort(d.created_at) }}</span>
        </div>
        <div class="flex w-3.5 flex-shrink-0 flex-col items-center">
          <div class="mt-3.5 h-2.5 w-2.5 flex-shrink-0 rounded-full" :class="dotCls(d.action)"></div>
          <div v-if="idx < decisions.length - 1" class="w-px flex-1 bg-[#e0d8cc]"></div>
        </div>
        <div class="min-w-0 flex-1 pb-4 pt-2.5">
          <div class="text-[11px] font-extrabold uppercase tracking-[0.5px]" :class="actCls(d.action)">{{ actLabel(d.action) }}</div>
          <div class="mt-1 text-[13px] leading-[1.8] text-[#4a3e28]">{{ d.reason }}</div>
          <div v-if="d.action !== 'hold' && d.amount_usdt > 0" class="mt-1.5 inline-block rounded-md bg-[#faf6f0] px-2.5 py-1 text-[11px] text-[#6a5a44]">
            {{ status.config.inst_id }} <b class="text-[#3a2e20]">{{ fmtNum(d.price) }}</b> × {{ Number(d.size_coin).toFixed(6) }} = <b class="text-[#3a2e20]">{{ fmtNum(d.amount_usdt) }} U</b>
          </div>
        </div>
      </div>

      <div v-if="hasMore" class="cursor-pointer py-4 text-center text-[11px] text-[#9a8a70] hover:text-[#5a4a30]" @click="loadMoreDecisions">加载更多 ↓</div>

    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';

const API = 'http://localhost:9701/apps/cryptobot';

const error = ref('');
let poller = null;

const status = reactive({
  config: { api_key: '', has_keys: false, directive: '', interval_sec: 300, inst_id: 'BTC-USDT', updated_at: '' },
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

// ---- API helpers ----

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

// ---- Load data ----

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

// ---- Actions ----

const doTestExchange = async () => {
  testingEx.value = true;
  testResult.value = null;
  try {
    await post('/exchange/test', exForm);
    testResult.value = { ok: true, msg: '✓ 连接成功' };
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

// ---- Computed ----

const eqColor = computed(() => status.equity.pnl >= 0 ? '#4a9a40' : '#c04030');

const runDuration = computed(() => {
  if (!status.state.started_at) return '';
  const ms = Date.now() - new Date(status.state.started_at).getTime();
  if (ms < 0) return '';
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins} 分钟`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时`;
  return `${Math.floor(hours / 24)} 天`;
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
    const y = 5 + (1 - (Number(p.equity) - min) / span) * 90;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
});

const eqFillPts = computed(() => eqPolyline.value ? `0,95 ${eqPolyline.value} 580,95` : '');

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
      const y = 5 + (1 - (vals[closest] - min) / span) * 90;
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
  if (hours < 24) return `${hours} 小时`;
  return `${Math.round(hours / 24)} 天`;
});

// ---- Format helpers ----

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
  if (a === 'buy') return '买入';
  if (a === 'sell') return '卖出';
  return '观望';
};

// ---- Lifecycle ----

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
.ex-input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #e0d8cc;
  border-radius: 8px;
  font-size: 11px;
  font-family: inherit;
  outline: none;
  background: #faf6f0;
}
.ex-input:focus { border-color: #b89860; }
.btn-dark {
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  border: 1px solid #3a2e20;
  background: #3a2e20;
  color: #f5efe4;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}
.btn-dark:hover { background: #4a3e30; }
.btn-ghost {
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  border: 1px solid #c0b098;
  background: transparent;
  color: #6a5a40;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}
.btn-ghost:hover { background: #f0e8d8; color: #3a2e20; }
.btn-ghost:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-stop {
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  border: 1px solid #e0b8a0;
  background: white;
  color: #c04030;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}
.btn-stop:hover { background: #fdf5ef; }
.dir-area {
  width: 100%;
  border: 1px solid #e0d8cc;
  border-radius: 10px;
  background: #faf6f0;
  padding: 12px;
  font-size: 14px;
  line-height: 1.9;
  font-family: inherit;
  color: #3a2e20;
  resize: vertical;
  outline: none;
  min-height: 72px;
}
.dir-area:focus { border-color: #b89860; }
.dir-area::placeholder { color: #c4b8a4; font-size: 13px; }
</style>
