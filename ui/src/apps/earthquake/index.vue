<template>
  <div class="flex h-full flex-col bg-[#1a1a2e] text-[#e0e0e0]" style="font-family: -apple-system, 'PingFang SC', sans-serif;">
    <div class="flex items-center gap-3 px-4 py-3 border-b border-[#2a2a4a] shrink-0">
      <span class="text-lg">🌍</span>
      <span class="font-semibold text-sm">__T_EQ_TITLE__</span>
      <div class="flex gap-1 ml-3">
        <button v-for="f in magFilters" :key="f.value" @click="minMag = f.value; loadQuakes()"
          class="px-2.5 py-1 text-xs rounded-full transition-colors"
          :class="minMag === f.value ? 'bg-[#e94560] text-white' : 'text-[#888] hover:bg-[#2a2a4a]'">
          {{ f.label }}
        </button>
      </div>
      <div class="ml-auto">
        <button @click="doAnalyze" :disabled="analyzing"
          class="px-3 py-1.5 text-xs rounded-full border border-[#2a2a4a] text-[#888] hover:border-[#e94560] hover:text-[#e94560] disabled:opacity-40 transition-colors">
          {{ analyzing ? '__T_EQ_ANALYZING__' : '✦ __T_EQ_ANALYZE__' }}
        </button>
      </div>
    </div>
    <div v-if="analysisText" class="mx-4 mt-3 bg-[#16213e] border border-[#2a2a4a] rounded-lg p-3 text-sm leading-relaxed text-[#aaa] whitespace-pre-wrap">
      {{ analysisText }}
      <button @click="analysisText = ''" class="block mt-2 text-[11px] text-[#555] hover:text-[#aaa]">__T_EQ_DISMISS__</button>
    </div>
    <div class="flex-1 flex flex-col overflow-hidden">
      <div class="relative shrink-0" style="height: 280px;">
        <svg viewBox="-180 -90 360 180" class="w-full h-full bg-[#0f3460]" preserveAspectRatio="xMidYMid meet">
          <rect x="-180" y="-90" width="360" height="180" fill="#0f3460" />
          <line v-for="lng in [-120,-60,0,60,120]" :key="'lng'+lng" :x1="lng" y1="-90" :x2="lng" y2="90" stroke="#1a1a4a" stroke-width="0.3" />
          <line v-for="lat in [-60,-30,0,30,60]" :key="'lat'+lat" x1="-180" :y1="-lat" x2="180" :y2="-lat" stroke="#1a1a4a" stroke-width="0.3" />
          <circle v-for="q in quakes" :key="q.id" :cx="q.lng" :cy="-q.lat" :r="Math.max(0.8, (q.mag - 2) * 0.8)" :fill="magColor(q.mag)" :fill-opacity="0.7" class="cursor-pointer" @click="selectQuake(q)"><title>M{{ q.mag }} - {{ q.place }}</title></circle>
        </svg>
        <div v-if="selected" class="absolute bottom-2 left-2 right-2 bg-[#16213e]/95 border border-[#2a2a4a] rounded-lg p-3 text-sm">
          <div class="flex justify-between items-start">
            <div><span class="font-bold text-base" :style="{ color: magColor(selected.mag) }">M{{ selected.mag }}</span><span class="text-[#aaa] ml-2">{{ selected.place }}</span></div>
            <button @click="selected = null" class="text-[#555] hover:text-[#aaa] text-xs">✕</button>
          </div>
          <div class="text-[11px] text-[#666] mt-1">__T_EQ_DEPTH__: {{ selected.depth }}km · {{ new Date(selected.time).toLocaleString() }}<span v-if="selected.tsunami" class="text-[#e94560] ml-1">⚠ __T_EQ_TSUNAMI__</span></div>
        </div>
      </div>
      <div class="flex-1 overflow-y-auto border-t border-[#2a2a4a]">
        <div v-if="loading" class="text-center text-[#555] text-sm py-8">__T_EQ_LOADING__</div>
        <div v-else class="text-[11px] text-[#555] px-4 py-2">{{ quakes.length }} earthquakes (M{{ minMag }}+)</div>
        <div v-for="q in quakes" :key="q.id" class="flex items-center gap-3 px-4 py-2.5 border-b border-[#1a1a2e] hover:bg-[#16213e] cursor-pointer transition-colors" :class="selected?.id === q.id ? 'bg-[#16213e]' : ''" @click="selectQuake(q)">
          <span class="font-mono font-bold text-sm w-10 text-center rounded px-1 py-0.5" :style="{ color: magColor(q.mag), backgroundColor: magColor(q.mag) + '18' }">{{ q.mag.toFixed(1) }}</span>
          <div class="flex-1 min-w-0"><div class="text-sm truncate">{{ q.place }}</div><div class="text-[11px] text-[#555]">{{ timeAgo(q.time) }} · __T_EQ_DEPTH__ {{ q.depth }}km</div></div>
          <span v-if="q.tsunami" class="text-[#e94560] text-xs">🌊</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { chatPanel } from '../../stores/chatPanel.js';
import { LOCALE } from '../../locale.js';
const quakes = ref([]); const loading = ref(false); const analyzing = ref(false); const analysisText = ref(''); const selected = ref(null); const minMag = ref(4);
const magFilters = [{ label: 'M2.5+', value: 2.5 }, { label: 'M4+', value: 4 }, { label: 'M5+', value: 5 }, { label: 'M6+', value: 6 }];
const magColor = (m) => m >= 7 ? '#ff0040' : m >= 6 ? '#e94560' : m >= 5 ? '#ff8c00' : m >= 4 ? '#ffc107' : '#4ecca3';
const timeAgo = (ts) => { const d = Date.now() - ts; if (d < 3600000) return Math.floor(d/60000) + 'm'; if (d < 86400000) return Math.floor(d/3600000) + 'h'; return Math.floor(d/86400000) + 'd'; };
const selectQuake = (q) => { selected.value = selected.value?.id === q.id ? null : q; };
const loadQuakes = async () => { loading.value = true; try { const res = await fetch(`/aios/apps/earthquake/list?minMagnitude=${minMag.value}`); const data = await res.json(); quakes.value = data.quakes || []; } catch {} loading.value = false; };
const doAnalyze = async () => { analyzing.value = true; try { const res = await fetch('/aios/apps/earthquake/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quakes: quakes.value.slice(0, 20), locale: LOCALE }) }); const data = await res.json(); analysisText.value = data.analysis || ''; } catch { analysisText.value = 'Failed'; } analyzing.value = false; };
onMounted(() => { loadQuakes(); chatPanel.setContext({ scene: 'earthquake', label: '__T_APP_SIDEBAR_EARTHQUAKE__' }); chatPanel.setQuickMessages(['__T_EQ_CHAT_QUICK_1__', '__T_EQ_CHAT_QUICK_2__', '__T_EQ_CHAT_QUICK_3__']); });
</script>
