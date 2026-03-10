<template>
  <div class="h-full overflow-y-auto bg-[#d2c5b3] bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.03)_0px,rgba(255,255,255,0.03)_2px,transparent_2px,transparent_8px)] p-4 font-['PingFang_SC','Microsoft_YaHei',sans-serif] text-[#3e3223]">
    <div class="mx-auto h-full w-full max-w-[560px] rounded-2xl border border-[#e2dbd6] bg-[#f1edeb] p-5 shadow-[inset_0_4px_6px_rgba(255,255,255,1),inset_0_-4px_6px_rgba(0,0,0,0.05),0_15px_25px_rgba(100,80,60,0.2),0_5px_10px_rgba(100,80,60,0.1)]">
      <div class="h-full overflow-y-auto pr-1 pb-8">
        <div class="mb-5 flex items-center justify-between border-b-2 border-[#dcd4cb] pb-3">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded border-2 border-[#91251c] bg-[#cb3e32] text-2xl font-black text-[#fffdfa] shadow-[inset_2px_2px_4px_rgba(255,255,255,0.4),0_2px_4px_rgba(0,0,0,0.2)]">₿</div>
            <div>
              <h1 class="mt-1 text-xl font-black tracking-widest">{{ t('cryptobot_system_title') }}</h1>
              <p class="text-[10px] font-bold uppercase tracking-wider text-[#8a7f72]">AIOS TRADING BOT · OKX</p>
            </div>
          </div>

          <div class="flex items-end gap-3">
            <div class="flex flex-col items-center gap-1">
              <div class="text-[9px] font-black text-[#8a7f72]">{{ t('cryptobot_exchange') }}</div>
              <button class="metal-btn flex h-[32px] w-[32px] items-center justify-center text-sm" @click="toggleExPanel">🔧</button>
            </div>
            <div class="flex flex-col items-center gap-1">
              <div class="text-[9px] font-black" :class="status.state.running ? 'text-[#5c996b]' : 'text-[#8a7f72]'">
                {{ status.state.running ? t('cryptobot_running') : t('cryptobot_stopped') }}
              </div>
              <button
                class="rocker-switch flex items-center justify-center text-[11px] tracking-widest"
                :class="status.state.running ? 'on' : 'off'"
                @click="status.state.running ? doStop() : doStart()"
              >
                {{ status.state.running ? t('cryptobot_running') : t('cryptobot_stopped') }}
              </button>
            </div>
          </div>
        </div>

        <div v-if="error" class="mb-4 rounded-lg border border-[#e8b8a0] bg-[#fdf5f0] px-3 py-2 text-xs text-[#c06040]">{{ error }}</div>

        <div v-if="showExPanel || !status.config.has_keys" class="maintenance-panel mb-6 p-4" id="config-panel">
          <div class="mb-3 flex items-center justify-between border-b border-[#bbaea0] pb-2">
            <h2 class="text-[13px] font-black tracking-widest text-[#4a3e30]">{{ t('cryptobot_exchange_config_title') }}</h2>
            <div class="flex items-center gap-1.5 rounded border px-2 py-0.5" :class="status.config.has_keys ? 'border-[#b8dab2] bg-[#d8eed3]' : 'border-[#d5c9bc] bg-[#efe6dc]'">
              <div class="h-1.5 w-1.5 rounded-full" :class="status.config.has_keys ? 'bg-green-600 shadow-[0_0_4px_#16a34a]' : 'bg-[#9f8f7d]'"></div>
              <span class="text-[9px] font-bold" :class="status.config.has_keys ? 'text-green-800' : 'text-[#7b6b59]'">{{ status.config.has_keys ? t('cryptobot_connected') : t('cryptobot_not_configured') }}</span>
            </div>
          </div>

          <div class="mb-3 rounded-lg border-2 border-[#c9a84a] bg-[#fff3c8] px-3 py-2 text-[11px] font-bold leading-relaxed text-[#6f4f00] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
            {{ t('cryptobot_risk_warning') }}
          </div>

          <div class="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-[10px] font-bold text-[#8a7f72]">{{ t('cryptobot_api_key') }}</label>
              <input v-model="exForm.api_key" type="password" autocomplete="off" :placeholder="t('cryptobot_api_key_placeholder')" class="w-full rounded border border-[#c2b9b0] bg-[#f6f3f0] p-2 font-['Courier_New',Courier,monospace] text-[11px] font-bold text-[#594c3d] shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] outline-none focus:border-[#a89883] focus:bg-white" @input="exDirty = true" />
            </div>
            <div>
              <label class="mb-1 block text-[10px] font-bold text-[#8a7f72]">{{ t('cryptobot_api_secret') }}</label>
              <input v-model="exForm.api_secret" type="password" autocomplete="off" :placeholder="t('cryptobot_api_secret_placeholder')" class="w-full rounded border border-[#c2b9b0] bg-[#f6f3f0] p-2 font-['Courier_New',Courier,monospace] text-[11px] font-bold tracking-widest text-[#594c3d] shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] outline-none focus:border-[#a89883] focus:bg-white" @input="exDirty = true" />
            </div>
            <div>
              <label class="mb-1 block text-[10px] font-bold text-[#8a7f72]">{{ t('cryptobot_passphrase') }}</label>
              <input v-model="exForm.passphrase" type="password" autocomplete="off" :placeholder="t('cryptobot_passphrase_placeholder')" class="w-full rounded border border-[#c2b9b0] bg-[#f6f3f0] p-2 font-['Courier_New',Courier,monospace] text-[11px] font-bold tracking-widest text-[#594c3d] shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] outline-none focus:border-[#a89883] focus:bg-white" @input="exDirty = true" />
            </div>
            <div>
              <label class="mb-1 block text-[10px] font-bold text-[#8a7f72]">{{ t('cryptobot_api_endpoint') }}</label>
              <input v-model="exForm.base_url" type="text" :placeholder="t('cryptobot_api_url_placeholder')" class="w-full rounded border border-[#c2b9b0] bg-[#f6f3f0] p-2 font-['Courier_New',Courier,monospace] text-[11px] font-bold text-[#594c3d] shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] outline-none focus:border-[#a89883] focus:bg-white" @input="exDirty = true" />
            </div>
          </div>

          <div class="mb-3 text-[10px] font-bold text-[#7b6b59]">{{ t('cryptobot_security_notice') }}</div>

          <div v-if="testResult" class="mb-2 text-[11px]" :class="testResult.ok ? 'text-[#2f7c3d]' : 'text-[#b84735]'">{{ testResult.msg }}</div>

          <div class="flex items-center justify-between gap-3 border-t border-[#bbaea0] pt-2">
            <button class="metal-btn px-3 py-1 text-[11px]" :disabled="testingEx" @click="doTestExchange">{{ testingEx ? t('cryptobot_testing') : t('cryptobot_test_connection') }}</button>
            <div class="flex items-center gap-3">
              <button class="metal-btn px-4 py-1.5 text-[11px] text-[#5e5448]" @click="showExPanel = false">{{ t('common_close') }}</button>
              <button class="metal-btn px-4 py-1.5 text-[11px] text-green-800" @click="doSaveExchange">{{ t('common_save') }}</button>
            </div>
          </div>
        </div>

        <div class="mb-8">
          <div class="maintenance-panel mb-4 p-4">
            <div class="mb-2 flex items-center justify-between border-b border-[#bbaea0] pb-2">
              <h2 class="text-[13px] font-black tracking-widest text-[#4a3e30]">{{ t('cryptobot_cycle_title') }}</h2>
              <span class="rounded border border-[#bbaea0] bg-[#efe6dc] px-2 py-0.5 text-[10px] font-bold text-[#7b6b59]">{{ countdownLabel }}</span>
            </div>
            <div class="mb-2 flex items-center justify-between gap-3">
              <label class="text-[11px] font-bold text-[#7b6c5a]">{{ t('cryptobot_interval_label') }}</label>
              <select v-model="intervalMin" class="cursor-pointer rounded border border-[#c2b9b0] bg-[#f6f3f0] px-2 py-1 font-['Courier_New',Courier,monospace] text-[11px] font-bold text-[#594c3d] shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] outline-none focus:border-[#a89883] focus:bg-white" @change="onIntervalChange">
                <option v-for="m in [1,2,3,5,10,15,30,60]" :key="m" :value="m">{{ t('cryptobot_every_n_minutes', { n: m }) }}</option>
              </select>
            </div>
            <div class="h-2 w-full overflow-hidden rounded bg-[#d7cec2]">
              <div class="h-full bg-[#8a997a] transition-[width] duration-500" :style="{ width: `${countdownProgress}%` }"></div>
            </div>
          </div>

          <div class="mb-2 flex items-end justify-between px-1">
            <h2 class="flex items-center gap-2 text-sm font-black tracking-widest text-[#594c3d]">
              <span class="text-lg text-[#c94c4c]">●</span>
              {{ t('cryptobot_directive') }}
            </h2>
          </div>

          <div class="target-board">
            <textarea v-model="directive" rows="3" spellcheck="false" :placeholder="t('cryptobot_directive_placeholder')"></textarea>

            <div class="mt-2 flex items-center justify-between border-t border-[#544d45] pt-2">
              <div class="text-[10px] font-bold text-[#968978]">
                {{ status.config.updated_at ? t('cryptobot_last_saved', { t: fmtTime(status.config.updated_at) }) : t('cryptobot_not_saved') }}
              </div>
              <button class="text-[11px] font-bold text-[#8a7f72] underline decoration-dashed transition hover:text-[#c94c4c]" @click="doSaveDirective">{{ t('common_save') }}</button>
            </div>
          </div>
        </div>

        <div class="lcd-screen mb-6 p-4">
          <div class="relative z-10 flex items-start justify-between">
            <div>
              <div class="mb-1 text-[11px] font-bold tracking-widest text-[#46543b]">{{ t('cryptobot_equity_total_usdt') }}</div>
              <div class="mechanical-roller mt-1 text-xl font-bold tabular-nums">{{ fmtNum(status.equity.current, 2) }}</div>
            </div>
          </div>

          <div class="relative z-0 mt-2 h-[64px] border-b border-[#8a997a] opacity-85">
            <svg viewBox="0 0 580 100" class="h-full w-full" preserveAspectRatio="none">
              <line v-for="y in [25, 50, 75]" :key="y" x1="0" :y1="y" x2="580" :y2="y" stroke="#8a997a" stroke-width="0.8" stroke-dasharray="2,2" />
              <defs>
                <linearGradient id="eqFillRetro" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" :stop-color="eqColor" stop-opacity="0.18"/>
                  <stop offset="100%" :stop-color="eqColor" stop-opacity="0"/>
                </linearGradient>
              </defs>
              <polygon v-if="eqPolyline" :points="eqFillPts" fill="url(#eqFillRetro)" />
              <polyline v-if="eqPolyline" :points="eqPolyline" fill="none" :stroke="eqColor" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" />
              <template v-for="dot in tradeDots" :key="dot.id">
                <circle :cx="dot.x" :cy="dot.y" r="3" :fill="dot.action === 'buy' ? '#1f2619' : '#5f2d25'" />
              </template>
              <text v-if="!eqPolyline" x="290" y="55" text-anchor="middle" fill="#5f6d52" font-size="12">{{ t('cryptobot_no_data') }}</text>
            </svg>
          </div>

          <div class="relative z-10 flex items-center justify-between pt-3 text-[10px] font-bold text-[#46543b]">
            <span>{{ t('cryptobot_ticks', { n: status.state.tick_count }) }} · {{ t('cryptobot_trades', { n: status.state.trade_count }) }}</span>
            <span class="rounded bg-[#8a997a] px-1.5 py-0.5 text-[#d7dfcd]">{{ eqTimespan ? `${t('cryptobot_recent')} ${eqTimespan}` : t('cryptobot_chart_recent_fallback') }}</span>
          </div>
        </div>

        <div class="flex flex-col">
          <div class="mb-2 px-1 text-[12px] font-black text-[#594c3d]">{{ t('cryptobot_latest_trades') }}</div>

          <div class="relative px-2 pt-1">
            <div class="receipt-paper p-4 pb-6 pt-5">
              <div class="mb-4 border-b-2 border-dashed border-[#d1c8bb] pb-2 text-center text-[12px] font-black tracking-widest text-[#756755]">
                === {{ t('cryptobot_trade_log_title') }} ===
              </div>

              <div v-if="!decisions.length" class="py-6 text-center text-[11px] font-bold text-[#9c9081]">{{ t('cryptobot_logs_empty') }}</div>

              <div v-for="d in decisions" :key="d.id" class="mb-4 border-b border-dashed border-[#e6e0d5] pb-3 last:mb-1 last:border-b-0 last:pb-0">
                <div class="mb-1 flex items-center justify-between text-[10px] font-bold text-[#8a7f72]">
                  <span>{{ fmtTime(d.created_at) }}</span>
                  <span>{{ t('cryptobot_order_no') }} #{{ d.id }}</span>
                </div>
                <div class="mb-1 flex items-center justify-between font-black">
                  <span
                    class="rounded border px-1.5 py-0.5 text-[11px]"
                    :class="d.action === 'buy'
                      ? 'border-[#bbf7d0] bg-[#dcfce7] text-[#166534]'
                      : d.action === 'sell'
                        ? 'border-[#fecaca] bg-[#fee2e2] text-[#991b1b]'
                        : 'border-[#d6ccbe] bg-[#f2ece2] text-[#7b6f62]'"
                  >
                    {{ actLabel(d.action) }} {{ status.config.inst_id || t('cryptobot_inst_unset') }}
                  </span>
                  <span class="text-xs text-[#594c3d]">
                    <template v-if="d.action !== 'hold' && d.amount_usdt > 0">{{ fmtNum(d.amount_usdt) }} U</template>
                    <template v-else>{{ t('cryptobot_no_fill') }}</template>
                  </span>
                </div>
                <div class="pr-2 text-[11px] font-bold leading-relaxed text-[#7a6f61]">{{ d.reason || '-' }}</div>
              </div>

              <button
                v-if="hasMore"
                type="button"
                class="mt-2 w-full cursor-pointer text-center text-[10px] font-bold text-[#9c9081] transition hover:text-[#c94c4c]"
                @click="loadMoreDecisions"
              >
                {{ t('cryptobot_load_more') }}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { useI18n } from '../../i18n/index.js';
const API = '/apps/cryptobot';
const { t } = useI18n();

const error = ref('');
let poller = null;
let ticker = null;
const nowTs = ref(Date.now());

const status = reactive({
  config: { has_api_key: false, has_api_secret: false, has_passphrase: false, has_keys: false, directive: '', interval_sec: 300, inst_id: '', updated_at: '', base_url: '' },
  state: { running: false, tick_count: 0, trade_count: 0, started_at: '', last_run_at: '', last_price: 0 },
  equity: { current: 10000, initial: 10000, pnl: 0, pnl_ratio: 0, today_change: 0 }
});

const showExPanel = ref(false);
const exDirty = ref(false);
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

const clearExchangeSecretInputs = () => {
  exForm.api_key = '';
  exForm.api_secret = '';
  exForm.passphrase = '';
};

const syncExFormFromStatus = () => {
  exForm.base_url = status.config.base_url || 'https://www.okx.com';
  clearExchangeSecretInputs();
  exDirty.value = false;
};

const toggleExPanel = () => {
  const opening = !showExPanel.value;
  showExPanel.value = opening;
  if (opening && !exDirty.value) syncExFormFromStatus();
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
    clearExchangeSecretInputs();
    testingEx.value = false;
  }
};

const doSaveExchange = async () => {
  error.value = '';
  try {
    await post('/exchange', exForm);
    showExPanel.value = false;
    testResult.value = null;
    await loadStatus();
    syncExFormFromStatus();
  } catch (e) {
    error.value = e.message;
  }
};

const doSaveDirective = async () => {
  error.value = '';
  try {
    await post('/directive', { directive: directive.value });
    await loadStatus();
  } catch (e) {
    error.value = e.message;
  }
};

const doStart = async () => {
  error.value = '';
  try {
    await post('/start', { interval_sec: intervalMin.value * 60 });
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

const onIntervalChange = () => {
  if (status.state.running) doStart();
};

const eqColor = computed(() => (status.equity.pnl >= 0 ? '#1f2619' : '#6a3a30'));

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
  const vals = pts.map((p) => Number(p.equity)).filter(Number.isFinite);
  if (vals.length < 2) return '';
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  return pts
    .map((p, i) => {
      const x = (i / (pts.length - 1)) * 580;
      const y = 5 + (1 - (Number(p.equity) - min) / span) * 90;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
});

const eqFillPts = computed(() => (eqPolyline.value ? `0,95 ${eqPolyline.value} 580,95` : ''));

const tradeDots = computed(() => {
  const pts = equityPts.value;
  if (pts.length < 2) return [];
  const vals = pts.map((p) => Number(p.equity));
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  return decisions.value
    .filter((d) => d.action === 'buy' || d.action === 'sell')
    .map((d) => {
      const dTime = new Date(d.created_at).getTime();
      let closest = 0;
      let minDiff = Infinity;
      pts.forEach((p, i) => {
        const diff = Math.abs(new Date(p.created_at).getTime() - dTime);
        if (diff < minDiff) {
          minDiff = diff;
          closest = i;
        }
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
  if (hours < 24) return t('cryptobot_hours', { n: hours });
  return t('cryptobot_days', { n: Math.round(hours / 24) });
});

const countdownSec = computed(() => {
  if (!status.state.running) return null;
  const intervalSec = Math.max(1, Number(status.config.interval_sec) || 300);
  if (!status.state.last_run_at) return intervalSec;
  const lastRunTs = new Date(status.state.last_run_at).getTime();
  if (Number.isNaN(lastRunTs)) return intervalSec;
  const elapsed = Math.floor((nowTs.value - lastRunTs) / 1000);
  return Math.max(0, intervalSec - elapsed);
});

const countdownLabel = computed(() => {
  if (countdownSec.value === null) return t('cryptobot_countdown_paused');
  if (countdownSec.value <= 0) return t('cryptobot_countdown_due');
  const total = countdownSec.value;
  const hh = Math.floor(total / 3600);
  const mm = Math.floor((total % 3600) / 60);
  const ss = total % 60;
  if (hh > 0) return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
});

const countdownProgress = computed(() => {
  if (countdownSec.value === null) return 0;
  const intervalSec = Math.max(1, Number(status.config.interval_sec) || 300);
  const done = intervalSec - countdownSec.value;
  const pct = (done / intervalSec) * 100;
  return Math.min(100, Math.max(0, pct));
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
    syncExFormFromStatus();
    if (!status.config.has_keys) showExPanel.value = true;
    poller = setInterval(() => loadAll().catch(() => {}), 5000);
    ticker = setInterval(() => {
      nowTs.value = Date.now();
    }, 1000);
  } catch (e) {
    error.value = e.message || t('cryptobot_init_failed');
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
.maintenance-panel {
  background-color: #e3ddd7;
  border: 2px solid #bbaea0;
  border-radius: 8px;
  box-shadow: inset 0 3px 6px rgba(0, 0, 0, 0.15), 0 2px 0 rgba(255, 255, 255, 0.8);
  background-image: linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px);
  background-size: 8px 8px;
}

.lcd-screen {
  background-color: #b7c2ab;
  border-radius: 8px;
  border: 3px solid #8c857d;
  box-shadow: inset 4px 4px 8px rgba(70, 80, 60, 0.4), inset -2px -2px 4px rgba(255, 255, 255, 0.5), 0 2px 0 rgba(255, 255, 255, 0.8);
  font-family: 'Courier New', Courier, monospace;
  color: #242b1c;
}

.mechanical-roller {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background-color: #3b5a3f;
  color: #e2ecd9;
  border: 1px solid #1e2e1f;
  box-shadow: inset 0 8px 10px rgba(0, 0, 0, 0.5), inset 0 -4px 6px rgba(0, 0, 0, 0.3), 0 2px 0 rgba(255, 255, 255, 0.8);
  border-radius: 4px;
  padding: 4px 8px;
}

.receipt-paper {
  background-color: #fbfbf9;
  background-image: linear-gradient(0deg, transparent 27px, #f2efe9 28px);
  background-size: 100% 28px;
  border: 1px solid #e8e3dc;
  box-shadow: 0 10px 15px -3px rgba(100, 80, 60, 0.15);
  border-bottom: 3px dotted #d1c8bb;
  position: relative;
  font-family: 'Courier New', Courier, monospace;
  color: #4a4136;
}

.receipt-paper::before {
  content: '';
  position: absolute;
  top: -10px;
  left: 10px;
  right: 10px;
  height: 10px;
  background: #2a2522;
  border-radius: 4px 4px 0 0;
  box-shadow: inset 0 -2px 4px rgba(0, 0, 0, 0.8);
  z-index: 10;
}

.rocker-switch {
  width: 54px;
  height: 32px;
  border-radius: 4px;
  color: white;
  font-weight: 900;
  transition: all 0.1s;
  cursor: pointer;
  position: relative;
}

.rocker-switch.on {
  background-color: #5c996b;
  box-shadow: inset 0 4px 0 rgba(255, 255, 255, 0.3), inset 0 -4px 0 rgba(0, 0, 0, 0.2), 0 4px 0 #284730, 0 6px 6px rgba(0, 0, 0, 0.3);
  border: 2px solid #284730;
}

.rocker-switch.off {
  background-color: #948a80;
  box-shadow: inset 0 4px 0 rgba(255, 255, 255, 0.25), inset 0 -4px 0 rgba(0, 0, 0, 0.2), 0 4px 0 #61574d, 0 6px 6px rgba(0, 0, 0, 0.25);
  border: 2px solid #61574d;
}

.rocker-switch:active {
  transform: translateY(3px);
}

.metal-btn {
  background: linear-gradient(180deg, #e8e3dd 0%, #c4bcb2 100%);
  border: 1px solid #9c9288;
  border-radius: 4px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 3px 0 #8c8378, 0 4px 4px rgba(0, 0, 0, 0.2);
  color: #4a4136;
  font-weight: 800;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.5);
  transition: all 0.1s;
}

.metal-btn:active {
  transform: translateY(3px);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 0 0 #8c8378, 0 1px 2px rgba(0, 0, 0, 0.2);
}

.metal-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.target-board {
  background-color: #3b3631;
  border-radius: 8px;
  border: 4px solid #b5a999;
  box-shadow: inset 0 4px 8px rgba(0, 0, 0, 0.5), 0 4px 0 #ffffff;
  padding: 12px;
}

.target-board textarea {
  background: transparent;
  color: #dfcd8c;
  font-family: 'PingFang SC', serif;
  font-size: 14px;
  font-weight: 900;
  line-height: 1.6;
  border: none;
  outline: none;
  resize: none;
  width: 100%;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

.target-board textarea::placeholder {
  color: #8c826c;
}
</style>
