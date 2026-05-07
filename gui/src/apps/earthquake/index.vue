<template>
  <div class="flex h-full flex-col bg-[#0a0f1a] text-[#c8d6e5]" style="font-family: -apple-system, 'PingFang SC', sans-serif;">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-2.5 border-b border-[#1a2332] shrink-0 bg-[#0d1320]">
      <div class="flex items-center gap-2.5">
        <span class="text-base">🌍</span>
        <span class="font-semibold text-sm">__T_EQ_TITLE__</span>
      </div>
      <div class="flex items-center gap-1.5">
        <button v-for="f in magFilters" :key="f.value" @click="minMag = f.value; loadQuakes()"
          class="px-2 py-0.5 text-[10px] rounded transition-colors"
          :class="minMag === f.value ? 'bg-[#e94560] text-white' : 'text-[#576574] hover:text-[#c8d6e5]'">
          {{ f.label }}
        </button>
        <span class="text-[#1a2332] mx-1">|</span>
        <button @click="doAnalyze" :disabled="analyzing"
          class="px-2.5 py-0.5 text-[10px] rounded transition-all disabled:opacity-30"
          :class="analyzing ? 'text-[#576574]' : 'text-[#e94560] hover:bg-[#e94560]/10'">
          {{ analyzing ? '__T_EQ_ANALYZING__' : '✦ __T_EQ_ANALYZE__' }}
        </button>
        <span class="text-[#1a2332] mx-1">|</span>
        <div class="dark-icons flex items-center gap-0.5">
          <ChatTrigger />
          <AppsTrigger />
        </div>
      </div>
    </div>

    <!-- AI Analysis -->
    <div v-if="analysisText" class="mx-3 mt-2 bg-[#111927] rounded-lg p-3 text-[12px] leading-relaxed text-[#576574] border border-[#1a2332]">
      <div v-html="renderMd(analysisText)"></div>
      <button @click="analysisText = ''" class="mt-1 text-[10px] text-[#2a3442] hover:text-[#576574]">__T_EQ_DISMISS__</button>
    </div>

    <!-- Map + List split -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Map area -->
      <div class="relative shrink-0 bg-[#071020]" style="height: 55%;">
        <svg viewBox="-180 -90 360 180" class="w-full h-full" preserveAspectRatio="xMidYMid meet">
          <rect x="-180" y="-90" width="360" height="180" fill="#071020" />
          <!-- Grid -->
          <g stroke="#0d1a30" stroke-width="0.2">
            <line v-for="lng in [-150,-120,-90,-60,-30,0,30,60,90,120,150]" :key="'lo'+lng" :x1="lng" y1="-90" :x2="lng" y2="90" />
            <line v-for="lat in [-60,-30,0,30,60]" :key="'la'+lat" x1="-180" :y1="-lat" x2="180" :y2="-lat" />
          </g>
          <!-- Equator -->
          <line x1="-180" y1="0" x2="180" y2="0" stroke="#0f2240" stroke-width="0.3" />
          <!-- Land -->
          <path v-for="(d, i) in landPaths" :key="'land'+i" :d="d" fill="#0f1d35" stroke="#1a3050" stroke-width="0.3" />
          <!-- Quake dots -->
          <circle v-for="q in quakes" :key="q.id"
            :cx="q.lng" :cy="-q.lat"
            :r="magRadius(q.mag)" :fill="magColor(q.mag)"
            :fill-opacity="q.id === selected?.id ? 0.95 : 0.55"
            :stroke="q.id === selected?.id ? '#fff' : 'none'" stroke-width="0.3"
            class="cursor-pointer transition-all duration-200" @click="selected = q">
          </circle>
        </svg>

        <!-- Selected popup -->
        <transition name="fade">
          <div v-if="selected" class="absolute bottom-3 left-3 right-3 bg-[#111927]/95 backdrop-blur-sm border border-[#1a2332] rounded-xl p-3">
            <div class="flex items-start justify-between">
              <div>
                <span class="inline-block px-2 py-0.5 rounded-md text-sm font-bold font-mono mr-2"
                  :style="{ color: magColor(selected.mag), background: magColor(selected.mag) + '15' }">
                  M{{ selected.mag }}
                </span>
                <span class="text-sm">{{ selected.place }}</span>
              </div>
              <button @click="selected = null" class="text-[#576574] hover:text-[#c8d6e5] text-xs ml-2">✕</button>
            </div>
            <div class="text-[11px] text-[#576574] mt-1.5 flex gap-3">
              <span>__T_EQ_DEPTH__ {{ selected.depth }}km</span>
              <span>{{ new Date(selected.time).toLocaleString() }}</span>
              <span v-if="selected.tsunami" class="text-[#e94560]">⚠ __T_EQ_TSUNAMI__</span>
            </div>
          </div>
        </transition>
      </div>

      <!-- Quake list -->
      <div class="flex-1 overflow-y-auto border-t border-[#1a2332]">
        <div class="px-4 py-1.5 text-[10px] text-[#2a3442] bg-[#0d1320] sticky top-0">
          {{ quakes.length }} earthquakes · M{{ minMag }}+ · 7d
        </div>
        <div v-if="loading" class="text-center text-[#2a3442] text-sm py-8">__T_EQ_LOADING__</div>
        <div v-for="q in quakes" :key="q.id"
          class="flex items-center gap-3 px-4 py-2 border-b border-[#111927] hover:bg-[#111927] cursor-pointer transition-colors"
          :class="selected?.id === q.id ? 'bg-[#111927]' : ''"
          @click="selected = q">
          <span class="font-mono font-bold text-xs w-9 text-center rounded-md py-0.5"
            :style="{ color: magColor(q.mag), background: magColor(q.mag) + '12' }">
            {{ q.mag.toFixed(1) }}
          </span>
          <div class="flex-1 min-w-0">
            <div class="text-[13px] truncate">{{ q.place }}</div>
            <div class="text-[10px] text-[#2a3442]">{{ timeAgo(q.time) }} · {{ q.depth }}km</div>
          </div>
          <span v-if="q.tsunami" class="text-[#e94560] text-[10px]">🌊</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

<script setup>
import { ref, onMounted } from 'vue';
import { marked } from 'marked';
import { LOCALE } from '@/system/locale.js';
import { landPaths } from './worldmap.js';
import AppsTrigger from '@/components/AppsTrigger.vue';
import ChatTrigger from '@/components/ChatTrigger.vue';
marked.setOptions({ breaks: true, gfm: true });
const renderMd = (t) => marked.parse(t || '');

const quakes = ref([]); const loading = ref(false); const analyzing = ref(false);
const analysisText = ref(''); const selected = ref(null); const minMag = ref(4);
const magFilters = [{ label: 'M2.5+', value: 2.5 }, { label: 'M4+', value: 4 }, { label: 'M5+', value: 5 }, { label: 'M6+', value: 6 }];

const magColor = (m) => m >= 7 ? '#ff2e63' : m >= 6 ? '#e94560' : m >= 5 ? '#ff8c42' : m >= 4 ? '#ffc93c' : '#4ecca3';
const magRadius = (m) => Math.max(1, (m - 2) * 1.2);
const timeAgo = (ts) => { const d = Date.now() - ts; return d < 3600000 ? Math.floor(d / 60000) + 'm' : d < 86400000 ? Math.floor(d / 3600000) + 'h' : Math.floor(d / 86400000) + 'd'; };

const loadQuakes = async () => { loading.value = true; selected.value = null; try { quakes.value = (await (await fetch(`/apps/earthquake/list?minMagnitude=${minMag.value}`)).json()).quakes || []; } catch {} loading.value = false; };

const doAnalyze = async () => {
  analyzing.value = true;
  try { analysisText.value = (await (await fetch('/apps/earthquake/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quakes: quakes.value.slice(0, 20), locale: LOCALE }) })).json()).analysis || ''; }
  catch { analysisText.value = 'Failed'; } analyzing.value = false;
};

onMounted(() => loadQuakes());
</script>

<style scoped>
/* 深色顶栏下让全局 .icon-btn 可读 */
.dark-icons :deep(.icon-btn) { width: 28px; height: 28px; color: #c8d6e5; }
.dark-icons :deep(.icon-btn:hover) { background: rgba(255,255,255,0.08); color: #fff; }
.dark-icons :deep(.icon-btn.active) { background: rgba(233,69,96,0.18); color: #e94560; }
.dark-icons :deep(.icon-btn .msi) { font-size: 18px; }
</style>
