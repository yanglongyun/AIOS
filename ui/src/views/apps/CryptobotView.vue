<template>
  <div class="h-full w-full overflow-y-auto bg-[#f5f0e8] text-[#3a2e20]" style="font-family: Georgia, 'Noto Serif SC', serif">
    <div class="mx-auto w-full max-w-3xl px-4 py-8">

      <!-- header + status -->
      <header class="mb-6 flex items-start justify-between border-b border-[#d8d0c0] pb-4">
        <div>
          <div class="flex items-center gap-2.5">
            <h1 class="text-2xl font-black tracking-tight text-[#3a2e20]">炒币机</h1>
            <span
              class="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
              :class="status.running ? 'bg-[#d8f0d0] text-[#2a7030]' : 'bg-[#ece4d8] text-[#9a8a70]'"
            >{{ status.running ? 'LIVE' : 'OFF' }}</span>
          </div>
          <p class="mt-1 text-xs text-[#a09078]">{{ status.config.inst_id || 'BTC-USDT' }} · {{ status.config.bar || '1H' }} · {{ status.config.live_mode ? '实盘' : '模拟' }}</p>
        </div>
        <div class="flex items-center gap-1.5">
          <button class="rounded-lg bg-[#3a2e20] px-3 py-1.5 text-[11px] font-bold text-[#f5efe4] transition hover:bg-[#4a3e30] disabled:opacity-40" :disabled="loadingAction || status.running" @click="startBot">启动</button>
          <button class="rounded-lg border border-[#d4c4b0] px-3 py-1.5 text-[11px] font-bold text-[#6a5a44] transition hover:bg-[#f0e8da] disabled:opacity-40" :disabled="loadingAction || !status.running" @click="stopBot">停止</button>
          <button class="rounded-lg border border-[#d4c4b0] px-3 py-1.5 text-[11px] font-bold text-[#6a5a44] transition hover:bg-[#f0e8da] disabled:opacity-40" :disabled="loadingAction" @click="runOnce">单次</button>
          <button class="rounded-lg border border-[#d4c4b0] px-3 py-1.5 text-[11px] font-bold text-[#6a5a44] transition hover:bg-[#f0e8da] disabled:opacity-40" :disabled="loadingAction" @click="refreshStrategy">刷新策略</button>
        </div>
      </header>

      <section v-if="error" class="mb-4 rounded-lg border border-[#e0b8a0] bg-[#fdf5ef] px-3 py-2 text-xs text-[#c05030]">{{ error }}</section>

      <!-- dashboard cards -->
      <section class="mb-6 grid grid-cols-4 gap-3">
        <div class="rounded-xl border border-[#ddd2c2] bg-[#fffdf8] p-3">
          <div class="text-[10px] font-bold uppercase tracking-widest text-[#a09078]">最新价</div>
          <div class="mt-1 font-mono text-lg font-black text-[#3a2e20]">{{ formatNum(status.state.last_price) }}</div>
        </div>
        <div class="rounded-xl border border-[#ddd2c2] bg-[#fffdf8] p-3">
          <div class="text-[10px] font-bold uppercase tracking-widest text-[#a09078]">权益</div>
          <div class="mt-1 font-mono text-lg font-black text-[#3a2e20]">{{ formatNum(status.state.latest_equity) }}</div>
        </div>
        <div class="rounded-xl border border-[#ddd2c2] bg-[#fffdf8] p-3">
          <div class="text-[10px] font-bold uppercase tracking-widest text-[#a09078]">收益</div>
          <div class="mt-1 font-mono text-lg font-black" :class="pnlColor">{{ formatNum(status.state.latest_pnl) }}</div>
        </div>
        <div class="rounded-xl border border-[#ddd2c2] bg-[#fffdf8] p-3">
          <div class="text-[10px] font-bold uppercase tracking-widest text-[#a09078]">收益率</div>
          <div class="mt-1 font-mono text-lg font-black" :class="pnlColor">{{ formatPct(status.state.latest_pnl_ratio) }}</div>
        </div>
      </section>

      <!-- equity chart -->
      <section class="mb-6 rounded-xl border border-[#ddd2c2] bg-[#fffdf8] p-4">
        <h2 class="mb-2 text-xs font-bold uppercase tracking-widest text-[#a09078]">收益曲线</h2>
        <svg viewBox="0 0 1000 220" class="h-[180px] w-full">
          <line x1="0" y1="55" x2="1000" y2="55" stroke="#ece4d8" stroke-width="1" />
          <line x1="0" y1="110" x2="1000" y2="110" stroke="#ece4d8" stroke-width="1" />
          <line x1="0" y1="165" x2="1000" y2="165" stroke="#ece4d8" stroke-width="1" />
          <defs>
            <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" :stop-color="Number(status.state.latest_pnl) >= 0 ? '#4a9a40' : '#c04030'" stop-opacity="0.12"/>
              <stop offset="100%" :stop-color="Number(status.state.latest_pnl) >= 0 ? '#4a9a40' : '#c04030'" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <polygon v-if="equityPoints.length > 1" :points="equityFillPoints" fill="url(#eqFill)" />
          <polyline
            v-if="equityPoints.length > 1"
            fill="none"
            :stroke="Number(status.state.latest_pnl) >= 0 ? '#4a9a40' : '#c04030'"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            :points="equityPolyline"
          />
          <text v-if="equityPoints.length <= 1" x="500" y="115" text-anchor="middle" fill="#b8a890" font-size="13">暂无曲线数据</text>
        </svg>
        <div v-if="status.state.last_run_at" class="mt-1 text-right text-[10px] text-[#b8a890]">上次执行 {{ formatTime(status.state.last_run_at) }}</div>
      </section>

      <!-- trades -->
      <section class="mb-4">
        <details open>
          <summary class="cursor-pointer select-none pb-2 text-xs font-bold uppercase tracking-widest text-[#a09078] transition hover:text-[#6a5a40]">
            交易记录（{{ tradeTotal }}）
          </summary>
          <div class="overflow-x-auto rounded-xl border border-[#ddd2c2] bg-[#fffdf8]">
            <table class="min-w-full text-left text-xs">
              <thead>
                <tr class="border-b border-[#ece4d8] text-[10px] font-bold uppercase tracking-wider text-[#a09078]">
                  <th class="px-3 py-2">时间</th>
                  <th class="px-3 py-2">方向</th>
                  <th class="px-3 py-2">价格</th>
                  <th class="px-3 py-2">数量</th>
                  <th class="px-3 py-2">金额</th>
                  <th class="px-3 py-2">原因</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="t in trades" :key="t.id" class="border-b border-[#f4ede4] last:border-0">
                  <td class="px-3 py-2 text-[#8a7a60]">{{ formatTime(t.created_at) }}</td>
                  <td class="px-3 py-2 font-bold" :class="t.side === 'buy' ? 'text-[#2a7a3a]' : 'text-[#c04030]'">{{ t.side === 'buy' ? 'BUY' : 'SELL' }}</td>
                  <td class="px-3 py-2 font-mono">{{ formatNum(t.price) }}</td>
                  <td class="px-3 py-2 font-mono">{{ formatNum(t.size_coin) }}</td>
                  <td class="px-3 py-2 font-mono">{{ formatNum(t.amount_usdt) }}</td>
                  <td class="max-w-[200px] truncate px-3 py-2 text-[#8a7a60]">{{ t.reason }}</td>
                </tr>
                <tr v-if="!trades.length"><td colspan="6" class="px-3 py-8 text-center text-[#b0a090]">暂无交易</td></tr>
              </tbody>
            </table>
          </div>
        </details>
      </section>

      <!-- logs -->
      <section class="mb-4">
        <details>
          <summary class="cursor-pointer select-none pb-2 text-xs font-bold uppercase tracking-widest text-[#a09078] transition hover:text-[#6a5a40]">
            运行日志（{{ logs.length }}）
          </summary>
          <div class="max-h-[280px] overflow-y-auto rounded-xl border border-[#ddd2c2] bg-[#fffdf8] p-2 text-xs">
            <div v-for="l in logs" :key="l.id" class="rounded-md px-2.5 py-1.5 mb-0.5" :class="logClass(l.level)">
              <span class="mr-2 text-[#a09078]">{{ formatTime(l.createdAt) }}</span>
              <span class="font-bold uppercase">{{ l.level }}</span>
              <span class="ml-1.5">{{ l.message }}</span>
            </div>
            <div v-if="!logs.length" class="px-2 py-8 text-center text-[#b0a090]">暂无日志</div>
          </div>
        </details>
      </section>

      <!-- config -->
      <section>
        <details>
          <summary class="cursor-pointer select-none pb-2 text-xs font-bold uppercase tracking-widest text-[#a09078] transition hover:text-[#6a5a40]">
            交易配置
          </summary>
          <div class="rounded-xl border border-[#ddd2c2] bg-[#fffdf8] p-4">
            <div class="grid grid-cols-2 gap-x-3 gap-y-2 md:grid-cols-3">
              <div v-for="field in configFields" :key="field.key">
                <label class="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-[#a09078]">{{ field.label }}</label>
                <input
                  v-if="field.type !== 'checkbox'"
                  :value="form[field.key]"
                  @input="form[field.key] = field.type === 'number' ? Number($event.target.value) : $event.target.value"
                  :type="field.type || 'text'"
                  :placeholder="field.placeholder || ''"
                  class="w-full rounded-lg border border-[#e0d8cc] bg-[#faf6f0] px-2.5 py-1.5 text-xs outline-none transition focus:border-[#b89860]"
                />
                <label v-else class="flex items-center gap-2 pt-1 text-xs text-[#6a5a44]">
                  <input v-model="form[field.key]" type="checkbox" class="accent-[#3a2e20]" />
                  {{ field.placeholder }}
                </label>
              </div>
            </div>

            <div class="mt-3 grid grid-cols-3 gap-2">
              <input v-model="form.api_key" placeholder="OKX API Key" class="rounded-lg border border-[#e0d8cc] bg-[#faf6f0] px-2.5 py-1.5 text-xs outline-none transition focus:border-[#b89860]" />
              <input v-model="form.api_secret" placeholder="OKX Secret" class="rounded-lg border border-[#e0d8cc] bg-[#faf6f0] px-2.5 py-1.5 text-xs outline-none transition focus:border-[#b89860]" />
              <input v-model="form.passphrase" placeholder="OKX Passphrase" class="rounded-lg border border-[#e0d8cc] bg-[#faf6f0] px-2.5 py-1.5 text-xs outline-none transition focus:border-[#b89860]" />
            </div>

            <div class="mt-3">
              <label class="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-[#a09078]">策略代码</label>
              <textarea
                v-model="form.strategy_code"
                rows="8"
                class="w-full rounded-lg border border-[#e0d8cc] bg-[#faf6f0] px-3 py-2 font-mono text-[11px] leading-5 outline-none transition focus:border-[#b89860]"
              ></textarea>
            </div>

            <div class="mt-3 flex items-center justify-between">
              <p class="text-[10px] text-[#b0a088]">API Key: {{ status.config.api_key || '未设置' }}</p>
              <button
                class="rounded-lg bg-[#3a2e20] px-4 py-1.5 text-[11px] font-bold text-[#f5efe4] transition hover:bg-[#4a3e30] disabled:opacity-40"
                :disabled="loadingAction"
                @click="saveConfig"
              >保存配置</button>
            </div>
          </div>
        </details>
      </section>

    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';

const API_BASE = 'http://localhost:9701/api/apps/cryptobot';

const loadingAction = ref(false);
const error = ref('');
const poller = ref(null);

const status = reactive({
  running: false,
  config: { api_key: '', base_url: 'https://www.okx.com' },
  state: { last_price: 0, latest_equity: 0, latest_pnl: 0, latest_pnl_ratio: 0, last_run_at: '' }
});

const form = reactive({
  base_url: 'https://www.okx.com',
  inst_id: 'BTC-USDT',
  bar: '1H',
  order_size_usdt: 50,
  interval_sec: 300,
  strategy_refresh_every: 12,
  live_mode: false,
  strategy_code: '',
  virtual_usdt: 10000,
  virtual_coin: 0,
  initial_equity: 10000,
  api_key: '',
  api_secret: '',
  passphrase: ''
});

const configFields = [
  { key: 'base_url', label: 'API URL', placeholder: 'https://www.okx.com' },
  { key: 'inst_id', label: '交易对', placeholder: 'BTC-USDT' },
  { key: 'bar', label: 'K线周期', placeholder: '1H' },
  { key: 'order_size_usdt', label: '单次金额', type: 'number', placeholder: 'USDT' },
  { key: 'interval_sec', label: '间隔(秒)', type: 'number' },
  { key: 'strategy_refresh_every', label: '策略刷新', type: 'number' },
  { key: 'virtual_usdt', label: '模拟 USDT', type: 'number' },
  { key: 'virtual_coin', label: '模拟币量', type: 'number' },
  { key: 'initial_equity', label: '初始权益', type: 'number' },
  { key: 'live_mode', label: '模式', type: 'checkbox', placeholder: '实盘交易' }
];

const equityPoints = ref([]);
const trades = ref([]);
const tradeTotal = ref(0);
const logs = ref([]);

const pnlColor = computed(() => Number(status.state.latest_pnl) >= 0 ? 'text-[#2a7a3a]' : 'text-[#c04030]');

const request = async (url, options = {}) => {
  const resp = await fetch(url, options);
  const data = await resp.json();
  if (!resp.ok || data.success === false) throw new Error(data.message || `HTTP ${resp.status}`);
  return data;
};

const syncFormFromStatus = () => {
  const cfg = status.config || {};
  form.base_url = cfg.base_url || form.base_url;
  form.inst_id = cfg.inst_id || form.inst_id;
  form.bar = cfg.bar || form.bar;
  form.order_size_usdt = Number(cfg.order_size_usdt || form.order_size_usdt);
  form.interval_sec = Number(cfg.interval_sec || form.interval_sec);
  form.strategy_refresh_every = Number(cfg.strategy_refresh_every || form.strategy_refresh_every);
  form.live_mode = Boolean(cfg.live_mode);
  form.strategy_code = String(cfg.strategy_code || '');
  form.virtual_usdt = Number(cfg.virtual_usdt || form.virtual_usdt);
  form.virtual_coin = Number(cfg.virtual_coin || form.virtual_coin);
  form.initial_equity = Number(cfg.initial_equity || form.initial_equity);
};

const loadStatus = async () => {
  const data = await request(`${API_BASE}/status`);
  status.running = Boolean(data.running);
  status.config = data.config || {};
  status.state = data.state || {};
  syncFormFromStatus();
};

const loadEquity = async () => {
  const data = await request(`${API_BASE}/equity?limit=300`);
  equityPoints.value = data.points || [];
};

const loadTrades = async () => {
  const data = await request(`${API_BASE}/trades?page=1&pageSize=50`);
  trades.value = data.items || [];
  tradeTotal.value = data.total || 0;
};

const loadLogs = async () => {
  const data = await request(`${API_BASE}/logs?limit=120`);
  logs.value = data.items || [];
};

const loadAll = async () => {
  await Promise.all([loadStatus(), loadEquity(), loadTrades(), loadLogs()]);
};

const buildConfigPayload = () => {
  const payload = {
    base_url: form.base_url,
    inst_id: form.inst_id,
    bar: form.bar,
    order_size_usdt: Number(form.order_size_usdt),
    interval_sec: Number(form.interval_sec),
    strategy_refresh_every: Number(form.strategy_refresh_every),
    live_mode: Boolean(form.live_mode),
    strategy_code: String(form.strategy_code || ''),
    virtual_usdt: Number(form.virtual_usdt),
    virtual_coin: Number(form.virtual_coin),
    initial_equity: Number(form.initial_equity)
  };
  if (form.api_key.trim()) payload.api_key = form.api_key.trim();
  if (form.api_secret.trim()) payload.api_secret = form.api_secret.trim();
  if (form.passphrase.trim()) payload.passphrase = form.passphrase.trim();
  return payload;
};

const withAction = async (fn) => {
  error.value = '';
  loadingAction.value = true;
  try {
    await fn();
    await loadAll();
  } catch (e) {
    error.value = e.message || '操作失败';
  } finally {
    loadingAction.value = false;
  }
};

const saveConfig = () => withAction(async () => {
  await request(`${API_BASE}/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildConfigPayload())
  });
  form.api_key = '';
  form.api_secret = '';
  form.passphrase = '';
});

const startBot = () => withAction(async () => {
  await request(`${API_BASE}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildConfigPayload())
  });
});

const stopBot = () => withAction(async () => {
  await request(`${API_BASE}/stop`, { method: 'POST' });
});

const runOnce = () => withAction(async () => {
  await request(`${API_BASE}/run-once`, { method: 'POST' });
});

const refreshStrategy = () => withAction(async () => {
  await request(`${API_BASE}/refresh-strategy`, { method: 'POST' });
});

const equityPolyline = computed(() => {
  if (!equityPoints.value.length) return '';
  const values = equityPoints.value.map(p => Number(p.equity)).filter(Number.isFinite);
  if (!values.length) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return equityPoints.value.map((p, idx) => {
    const x = (idx / Math.max(1, equityPoints.value.length - 1)) * 1000;
    const y = 10 + (1 - (Number(p.equity) - min) / span) * 200;
    return `${x},${y}`;
  }).join(' ');
});

const equityFillPoints = computed(() => {
  if (!equityPolyline.value) return '';
  return `0,210 ${equityPolyline.value} 1000,210`;
});

const formatTime = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('zh-CN', { hour12: false });
};

const formatNum = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return '-';
  return n.toLocaleString('en-US', { maximumFractionDigits: 4 });
};

const formatPct = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return '-';
  return `${(n * 100).toFixed(2)}%`;
};

const logClass = (level) => {
  if (level === 'error') return 'bg-[#fdeeed] text-[#b03030]';
  if (level === 'warn') return 'bg-[#fdf5e8] text-[#9a6a28]';
  return 'text-[#4a6a38]';
};

onMounted(async () => {
  try {
    await loadAll();
    poller.value = setInterval(() => { loadAll().catch(() => {}); }, 5000);
  } catch (e) {
    error.value = e.message || '初始化失败';
  }
});

onUnmounted(() => {
  if (poller.value) { clearInterval(poller.value); poller.value = null; }
});
</script>
