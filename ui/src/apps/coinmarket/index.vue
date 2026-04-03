<template>
  <div class="flex h-full flex-col bg-[#0b0e11] text-[#eaecef]" style="font-family: -apple-system, 'PingFang SC', sans-serif;">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-[#1e2329] shrink-0">
      <div class="flex items-center gap-3">
        <template v-if="view === 'detail'">
          <button @click="view = 'list'" class="text-[#f0b90b] hover:text-[#fcd535] text-sm">← __T_COIN_BACK__</button>
        </template>
        <template v-else>
          <span class="text-[#f0b90b] font-bold text-base">₿</span>
          <span class="font-semibold text-sm">__T_COIN_TITLE__</span>
        </template>
      </div>
      <button v-if="view === 'list'" @click="doAnalyze" :disabled="analyzing"
        class="px-3 py-1.5 text-[11px] font-medium rounded transition-all disabled:opacity-30"
        :class="analyzing ? 'bg-[#1e2329] text-[#848e9c]' : 'bg-[#f0b90b]/10 text-[#f0b90b] hover:bg-[#f0b90b]/20'">
        {{ analyzing ? '__T_COIN_ANALYZING__' : '✦ __T_COIN_ANALYZE__' }}
      </button>
    </div>

    <!-- AI Analysis -->
    <div v-if="analysisText" class="mx-4 mt-3 bg-[#1e2329] rounded-xl p-4 text-sm leading-relaxed text-[#848e9c] border border-[#2b3139]">
      <div v-html="renderMd(analysisText)"></div>
      <button @click="analysisText = ''" class="mt-2 text-[10px] text-[#474d57] hover:text-[#848e9c]">__T_COIN_DISMISS__</button>
    </div>

    <!-- Coin List -->
    <div v-if="view === 'list'" class="flex-1 overflow-y-auto">
      <div v-if="loading" class="text-center text-[#474d57] text-sm py-16">__T_COIN_LOADING__</div>
      <div v-else>
        <!-- Table header -->
        <div class="sticky top-0 bg-[#0b0e11] grid grid-cols-[2.5rem_1fr_5.5rem_4.5rem_6rem_5rem] gap-2 px-4 py-2 text-[10px] text-[#474d57] uppercase tracking-wider border-b border-[#1e2329]">
          <span>#</span><span>Coin</span><span class="text-right">__T_COIN_PRICE__</span><span class="text-right">24h</span><span class="text-right">__T_COIN_MARKET_CAP__</span><span class="text-right">7d</span>
        </div>
        <div v-for="coin in coins" :key="coin.id"
          class="grid grid-cols-[2.5rem_1fr_5.5rem_4.5rem_6rem_5rem] gap-2 items-center px-4 py-2.5 border-b border-[#1e2329]/50 hover:bg-[#1e2329]/60 cursor-pointer transition-colors"
          @click="openDetail(coin.id)">
          <span class="text-[#474d57] text-xs">{{ coin.rank }}</span>
          <div class="flex items-center gap-2 min-w-0">
            <img :src="coin.image" class="w-5 h-5 rounded-full shrink-0" />
            <span class="font-medium text-sm truncate">{{ coin.symbol.toUpperCase() }}</span>
          </div>
          <span class="text-right text-sm font-mono">${{ fmtPrice(coin.price) }}</span>
          <span class="text-right text-xs font-mono" :class="coin.change24h >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'">{{ fmtPct(coin.change24h) }}%</span>
          <span class="text-right text-xs text-[#848e9c]">${{ fmtCap(coin.marketCap) }}</span>
          <!-- Mini sparkline -->
          <div class="flex justify-end">
            <svg viewBox="0 0 60 20" class="w-[50px] h-[18px]">
              <polyline :points="miniChart(coin.sparkline)" fill="none"
                :stroke="coin.change7d >= 0 ? '#0ecb81' : '#f6465d'" stroke-width="1.2" stroke-linecap="round" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Detail -->
    <div v-if="view === 'detail'" class="flex-1 overflow-y-auto">
      <div v-if="detailLoading" class="text-center text-[#474d57] text-sm py-16">__T_COIN_LOADING__</div>
      <div v-else-if="dc" class="px-4 py-5">
        <!-- Hero -->
        <div class="flex items-center gap-4 mb-5">
          <img :src="dc.image" class="w-10 h-10 rounded-full" />
          <div class="flex-1">
            <div class="font-bold text-lg">{{ dc.name }} <span class="text-[#474d57] text-sm font-normal">{{ dc.symbol?.toUpperCase() }}</span></div>
            <div class="text-[11px] text-[#474d57]">__T_COIN_RANK__ #{{ dc.rank }}</div>
          </div>
          <div class="text-right">
            <div class="text-2xl font-mono font-bold">${{ fmtPrice(dc.price) }}</div>
            <div class="text-sm font-mono" :class="dc.change24h >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'">{{ fmtPct(dc.change24h) }}%</div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="mb-4 flex items-center gap-2 border-b border-[#1e2329] pb-3">
          <button
            type="button"
            class="rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors"
            :class="detailTab === 'overview' ? 'bg-[#f0b90b]/15 text-[#f0b90b]' : 'text-[#848e9c] hover:bg-[#1e2329]'"
            @click="detailTab = 'overview'"
          >
            __T_COIN_TAB_OVERVIEW__
          </button>
          <button
            type="button"
            class="rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors"
            :class="detailTab === 'analysis' ? 'bg-[#f0b90b]/15 text-[#f0b90b]' : 'text-[#848e9c] hover:bg-[#1e2329]'"
            @click="detailTab = 'analysis'"
          >
            __T_COIN_TAB_ANALYSIS__
          </button>
        </div>

        <template v-if="detailTab === 'overview'">
        <!-- Chart -->
        <div class="bg-[#1e2329] rounded-xl p-4 mb-4 border border-[#2b3139]">
          <div class="text-[10px] text-[#474d57] uppercase tracking-wider mb-3">__T_COIN_7D_PRICE__</div>
          <svg :viewBox="`0 0 400 140`" class="w-full" style="height: 140px;">
            <defs>
              <linearGradient :id="'cg'+dc.symbol" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" :stop-color="dc.change7d >= 0 ? '#0ecb81' : '#f6465d'" stop-opacity="0.15" />
                <stop offset="100%" :stop-color="dc.change7d >= 0 ? '#0ecb81' : '#f6465d'" stop-opacity="0" />
              </linearGradient>
            </defs>
            <polygon :points="areaPoints" :fill="`url(#cg${dc.symbol})`" />
            <polyline :points="linePoints" fill="none" :stroke="dc.change7d >= 0 ? '#0ecb81' : '#f6465d'" stroke-width="1.5" />
          </svg>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 gap-3">
          <div v-for="stat in detailStats" :key="stat.label" class="bg-[#1e2329] rounded-xl p-3 border border-[#2b3139]">
            <div class="text-[10px] text-[#474d57] uppercase tracking-wider mb-1">{{ stat.label }}</div>
            <div class="font-mono text-sm">{{ stat.value }}</div>
          </div>
        </div>

        <div v-if="dc.description" class="mt-4 rounded-xl border border-[#2b3139] bg-[#1e2329] p-4">
          <div class="mb-2 text-[10px] uppercase tracking-wider text-[#474d57]">__T_COIN_ABOUT__</div>
          <p class="text-sm leading-7 text-[#b7bdc6]">{{ dc.description }}</p>
        </div>
        </template>

        <template v-else>
          <div class="rounded-xl border border-[#2b3139] bg-[#1e2329] p-4">
            <div class="flex items-center justify-between gap-3">
              <div>
                <div class="text-sm font-semibold text-[#eaecef]">__T_COIN_ANALYZE__</div>
                <div class="mt-1 text-[11px] leading-relaxed text-[#848e9c]">__T_COIN_ANALYZE_DESC__</div>
              </div>
              <button
                type="button"
                @click="analyzeCoin"
                :disabled="detailAnalyzing"
                class="shrink-0 rounded-lg px-3 py-2 text-[11px] font-medium transition-all disabled:opacity-30"
                :class="detailAnalyzing ? 'bg-[#2b3139] text-[#848e9c]' : 'bg-[#f0b90b]/10 text-[#f0b90b] hover:bg-[#f0b90b]/20'"
              >
                {{ detailAnalyzing ? '__T_COIN_ANALYZING__' : '__T_COIN_NEW_ANALYSIS__' }}
              </button>
            </div>

            <div v-if="detailAnalysisText" class="mt-4 rounded-xl border border-[#2b3139] bg-[#15191e] p-4">
              <div class="mb-2 text-[10px] uppercase tracking-wider text-[#474d57]">__T_COIN_LATEST__</div>
              <div class="coin-analysis text-sm leading-relaxed text-[#b7bdc6]" v-html="renderMd(detailAnalysisText)"></div>
            </div>

            <div class="mt-4">
              <div class="mb-2 text-[10px] uppercase tracking-wider text-[#474d57]">__T_COIN_HISTORY__</div>
              <div v-if="!detailAnalysisHistory.length" class="rounded-xl border border-dashed border-[#2b3139] px-4 py-6 text-center text-[12px] text-[#6b7280]">
                __T_COIN_NO_HISTORY__
              </div>
              <div v-else class="space-y-3">
                <div v-for="item in detailAnalysisHistory" :key="item.id" class="rounded-xl border border-[#2b3139] bg-[#15191e] p-4">
                  <div class="mb-2 flex items-center justify-between gap-3">
                    <div class="text-[11px] font-medium text-[#eaecef]">{{ item.coin_name }} ({{ item.coin_symbol?.toUpperCase() }}) · ${{ fmtPrice(item.price) }}</div>
                    <div class="text-[10px] text-[#6b7280]">{{ item.created_at?.slice(0, 16).replace('T', ' ') }}</div>
                  </div>
                  <div class="coin-analysis text-sm leading-relaxed text-[#b7bdc6]" v-html="renderMd(item.analysis)"></div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { marked } from 'marked';
import { LOCALE } from '../../locale.js';
marked.setOptions({ breaks: true, gfm: true });
const renderMd = (t) => marked.parse(t || '');

const view = ref('list'); const coins = ref([]); const loading = ref(false);
const analyzing = ref(false); const analysisText = ref('');
const dc = ref(null); const detailChart = ref([]); const detailLoading = ref(false);
const detailTab = ref('overview');
const detailAnalyzing = ref(false);
const detailAnalysisText = ref('');
const detailAnalysisHistory = ref([]);

const fmtPrice = (n) => n >= 1 ? Number(n).toLocaleString('en', { maximumFractionDigits: 2 }) : Number(n).toPrecision(4);
const fmtPct = (n) => (n >= 0 ? '+' : '') + Number(n || 0).toFixed(2);
const fmtCap = (n) => n >= 1e9 ? (n / 1e9).toFixed(1) + 'B' : n >= 1e6 ? (n / 1e6).toFixed(0) + 'M' : String(n || 0);
const fmtSupply = (n) => Number(n || 0).toLocaleString('en', { maximumFractionDigits: 0 });
const fmtHistoryTime = (v) => new Date(v).toLocaleString(LOCALE === 'zh' ? 'zh-CN' : 'en-US', {
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
});

const miniChart = (data) => {
  if (!data?.length) return '';
  const mn = Math.min(...data); const mx = Math.max(...data); const r = mx - mn || 1;
  return data.filter((_, i) => i % Math.ceil(data.length / 30) === 0).map((v, i, a) => `${(i / (a.length - 1)) * 60},${20 - ((v - mn) / r) * 18}`).join(' ');
};

const chartPts = (data, w, h) => {
  if (!data.length) return '';
  const ps = data.map(d => d.p); const mn = Math.min(...ps); const mx = Math.max(...ps); const r = mx - mn || 1;
  return data.map((d, i) => `${(i / (data.length - 1)) * w},${h - ((d.p - mn) / r) * (h - 10) - 5}`).join(' ');
};
const linePoints = computed(() => chartPts(detailChart.value, 400, 140));
const areaPoints = computed(() => { const lp = linePoints.value; return lp ? `0,140 ${lp} 400,140` : ''; });

const detailStats = computed(() => dc.value ? [
  { label: '__T_COIN_24H_HIGH__', value: '$' + fmtPrice(dc.value.high24h) },
  { label: '__T_COIN_24H_LOW__', value: '$' + fmtPrice(dc.value.low24h) },
  { label: '__T_COIN_MARKET_CAP__', value: '$' + fmtCap(dc.value.marketCap) },
  { label: '__T_COIN_ATH__', value: '$' + fmtPrice(dc.value.ath) },
  { label: '__T_COIN_24H_VOLUME__', value: '$' + fmtCap(dc.value.volume24h) },
  { label: '__T_COIN_CIRCULATING__', value: fmtSupply(dc.value.circulatingSupply) },
  { label: '__T_COIN_TOTAL_SUPPLY__', value: dc.value.totalSupply ? fmtSupply(dc.value.totalSupply) : '--' },
  { label: '__T_COIN_ATH_DRAWDOWN__', value: `${fmtPct(dc.value.athChangePct)}%` }
] : []);

const loadCoinHistory = async (coinId) => {
  try {
    const data = await (await fetch(`/aios/apps/coinmarket/coin-history?coinId=${coinId}`)).json();
    detailAnalysisHistory.value = data.analyses || [];
    detailAnalysisText.value = detailAnalysisHistory.value[0]?.analysis || '';
  } catch { detailAnalysisHistory.value = []; }
};

const api = async (p) => { const r = await fetch(`/aios/apps/coinmarket/${p}`); return r.json(); };
const loadCoins = async () => { loading.value = true; try { coins.value = (await api('list')).coins || []; } catch {} loading.value = false; };

const openDetail = async (id) => {
  view.value = 'detail'; detailLoading.value = true;
  detailTab.value = 'overview';
  detailAnalysisText.value = '';
  detailAnalysisHistory.value = [];
  try {
    const d = await api(`detail?id=${id}`);
    dc.value = d.coin;
    detailChart.value = d.chart || [];
    if (d.coin?.id) await loadCoinHistory(d.coin.id);
  } catch {}
  detailLoading.value = false;
};

const doAnalyze = async () => {
  analyzing.value = true;
  try { analysisText.value = (await (await fetch('/aios/apps/coinmarket/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ coins: coins.value.slice(0, 10), locale: LOCALE }) })).json()).analysis || ''; }
  catch { analysisText.value = 'Failed'; } analyzing.value = false;
};

const analyzeCoin = async () => {
  if (!dc.value || detailAnalyzing.value) return;
  detailAnalyzing.value = true;
  try {
    const data = await (await fetch('/aios/apps/coinmarket/coin-analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coin: dc.value, locale: LOCALE })
    })).json();
    detailAnalysisText.value = data.analysis || '';
    await loadCoinHistory(dc.value.id);
  } catch {
    detailAnalysisText.value = 'Failed';
  }
  detailAnalyzing.value = false;
};

onMounted(() => loadCoins());
</script>

<style scoped>
.coin-analysis :deep(p) { margin: 0.35em 0; }
.coin-analysis :deep(p:first-child) { margin-top: 0; }
.coin-analysis :deep(p:last-child) { margin-bottom: 0; }
.coin-analysis :deep(strong) { color: #f3f4f6; }
.coin-analysis :deep(ul),
.coin-analysis :deep(ol) { padding-left: 1.2rem; margin: 0.35em 0; }
</style>
