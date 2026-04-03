<template>
  <div class="flex h-full flex-col bg-[#0d1117] text-[#e6edf3]" style="font-family: -apple-system, 'PingFang SC', sans-serif;">
    <div class="flex items-center gap-3 px-4 py-3 border-b border-[#21262d] shrink-0">
      <template v-if="view === 'detail'">
        <button @click="view = 'list'" class="text-[#58a6ff] hover:text-[#79c0ff] text-sm">← __T_COIN_BACK__</button>
      </template>
      <template v-else>
        <span class="text-lg">📈</span>
        <span class="font-semibold text-sm">__T_COIN_TITLE__</span>
      </template>
      <div class="ml-auto">
        <button v-if="view === 'list'" @click="doAnalyze" :disabled="analyzing"
          class="px-3 py-1.5 text-xs rounded-full border border-[#30363d] text-[#8b949e] hover:border-[#58a6ff] hover:text-[#58a6ff] disabled:opacity-40 transition-colors">
          {{ analyzing ? '__T_COIN_ANALYZING__' : '✦ __T_COIN_ANALYZE__' }}
        </button>
      </div>
    </div>
    <div v-if="analysisText" class="mx-4 mt-3 bg-[#161b22] border border-[#30363d] rounded-lg p-3 text-sm leading-relaxed text-[#8b949e] whitespace-pre-wrap">
      {{ analysisText }}
      <button @click="analysisText = ''" class="block mt-2 text-[11px] text-[#484f58] hover:text-[#8b949e]">__T_COIN_DISMISS__</button>
    </div>
    <div v-if="view === 'list'" class="flex-1 overflow-y-auto">
      <div v-if="loading" class="text-center text-[#484f58] text-sm py-12">__T_COIN_LOADING__</div>
      <table v-else class="w-full text-sm">
        <thead class="text-[11px] text-[#484f58] uppercase sticky top-0 bg-[#0d1117]">
          <tr class="border-b border-[#21262d]">
            <th class="text-left px-4 py-2 w-8">#</th><th class="text-left px-2 py-2">Coin</th>
            <th class="text-right px-2 py-2">__T_COIN_PRICE__</th><th class="text-right px-2 py-2">24h</th>
            <th class="text-right px-2 py-2">7d</th><th class="text-right px-4 py-2 hidden sm:table-cell">__T_COIN_MARKET_CAP__</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="coin in coins" :key="coin.id" class="border-b border-[#161b22] hover:bg-[#161b22] cursor-pointer transition-colors" @click="openDetail(coin.id)">
            <td class="px-4 py-2.5 text-[#484f58]">{{ coin.rank }}</td>
            <td class="px-2 py-2.5"><div class="flex items-center gap-2"><img :src="coin.image" class="w-5 h-5 rounded-full" /><span class="font-medium">{{ coin.symbol.toUpperCase() }}</span><span class="text-[#484f58] text-xs hidden sm:inline">{{ coin.name }}</span></div></td>
            <td class="px-2 py-2.5 text-right font-mono">${{ formatPrice(coin.price) }}</td>
            <td class="px-2 py-2.5 text-right font-mono" :class="coin.change24h >= 0 ? 'text-[#3fb950]' : 'text-[#f85149]'">{{ formatPct(coin.change24h) }}%</td>
            <td class="px-2 py-2.5 text-right font-mono" :class="coin.change7d >= 0 ? 'text-[#3fb950]' : 'text-[#f85149]'">{{ formatPct(coin.change7d) }}%</td>
            <td class="px-4 py-2.5 text-right text-[#8b949e] hidden sm:table-cell">${{ formatCap(coin.marketCap) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="view === 'detail'" class="flex-1 overflow-y-auto px-4 py-4">
      <div v-if="detailLoading" class="text-center text-[#484f58] text-sm py-12">__T_COIN_LOADING__</div>
      <div v-else-if="detailCoin">
        <div class="flex items-center gap-3 mb-4">
          <img :src="detailCoin.image" class="w-8 h-8 rounded-full" />
          <div><div class="font-semibold">{{ detailCoin.name }} <span class="text-[#484f58]">{{ detailCoin.symbol?.toUpperCase() }}</span></div><div class="text-xs text-[#484f58]">__T_COIN_RANK__ #{{ detailCoin.rank }}</div></div>
          <div class="ml-auto text-right"><div class="text-xl font-mono font-semibold">${{ formatPrice(detailCoin.price) }}</div><div class="text-sm font-mono" :class="detailCoin.change24h >= 0 ? 'text-[#3fb950]' : 'text-[#f85149]'">{{ formatPct(detailCoin.change24h) }}% (24h)</div></div>
        </div>
        <div class="bg-[#161b22] border border-[#21262d] rounded-lg p-4 mb-4">
          <div class="text-[11px] text-[#484f58] uppercase mb-2">__T_COIN_7D_PRICE__</div>
          <svg :viewBox="`0 0 ${chartWidth} ${chartHeight}`" class="w-full" style="height: 160px;"><polyline :points="chartPoints" fill="none" :stroke="detailCoin.change7d >= 0 ? '#3fb950' : '#f85149'" stroke-width="1.5" /></svg>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-[#161b22] border border-[#21262d] rounded-lg p-3"><div class="text-[11px] text-[#484f58] uppercase mb-1">__T_COIN_24H_HIGH__</div><div class="font-mono text-sm">${{ formatPrice(detailCoin.high24h) }}</div></div>
          <div class="bg-[#161b22] border border-[#21262d] rounded-lg p-3"><div class="text-[11px] text-[#484f58] uppercase mb-1">__T_COIN_24H_LOW__</div><div class="font-mono text-sm">${{ formatPrice(detailCoin.low24h) }}</div></div>
          <div class="bg-[#161b22] border border-[#21262d] rounded-lg p-3"><div class="text-[11px] text-[#484f58] uppercase mb-1">__T_COIN_MARKET_CAP__</div><div class="font-mono text-sm">${{ formatCap(detailCoin.marketCap) }}</div></div>
          <div class="bg-[#161b22] border border-[#21262d] rounded-lg p-3"><div class="text-[11px] text-[#484f58] uppercase mb-1">__T_COIN_ATH__</div><div class="font-mono text-sm">${{ formatPrice(detailCoin.ath) }}</div></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { chatPanel } from '../../stores/chatPanel.js';
import { LOCALE } from '../../locale.js';
const view = ref('list'); const coins = ref([]); const loading = ref(false); const analyzing = ref(false); const analysisText = ref('');
const detailCoin = ref(null); const detailChart = ref([]); const detailLoading = ref(false); const chartWidth = 400; const chartHeight = 120;
const chartPoints = computed(() => { const d = detailChart.value; if (!d.length) return ''; const ps = d.map(v => v.p); const mn = Math.min(...ps); const mx = Math.max(...ps); const r = mx - mn || 1; return d.map((v, i) => `${(i/(d.length-1))*chartWidth},${chartHeight-((v.p-mn)/r)*(chartHeight-10)-5}`).join(' '); });
const formatPrice = (n) => n >= 1 ? Number(n).toLocaleString('en', { maximumFractionDigits: 2 }) : Number(n).toPrecision(4);
const formatPct = (n) => (n >= 0 ? '+' : '') + Number(n || 0).toFixed(1);
const formatCap = (n) => n >= 1e9 ? (n/1e9).toFixed(1)+'B' : n >= 1e6 ? (n/1e6).toFixed(1)+'M' : Number(n||0).toLocaleString();
const api = async (path) => { const res = await fetch(`/aios/apps/coinmarket/${path}`); return res.json(); };
const loadCoins = async () => { loading.value = true; try { const data = await api('list'); coins.value = data.coins || []; } catch {} loading.value = false; };
const openDetail = async (id) => { view.value = 'detail'; detailLoading.value = true; try { const data = await api(`detail?id=${id}`); detailCoin.value = data.coin || null; detailChart.value = data.chart || []; } catch {} detailLoading.value = false; };
const doAnalyze = async () => { analyzing.value = true; try { const res = await fetch('/aios/apps/coinmarket/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ coins: coins.value.slice(0, 10), locale: LOCALE }) }); const data = await res.json(); analysisText.value = data.analysis || ''; } catch { analysisText.value = 'Failed'; } analyzing.value = false; };
onMounted(() => { loadCoins(); chatPanel.setContext({ scene: 'coinmarket', label: '__T_APP_SIDEBAR_COINMARKET__' }); chatPanel.setQuickMessages(['__T_COIN_CHAT_QUICK_1__', '__T_COIN_CHAT_QUICK_2__', '__T_COIN_CHAT_QUICK_3__']); });
</script>
