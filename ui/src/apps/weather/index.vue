<template>
  <div class="flex h-full flex-col text-white overflow-hidden" :style="{ background: skyGradient }" style="font-family: -apple-system, 'PingFang SC', sans-serif;">
    <div class="flex items-center justify-between px-4 py-2.5 shrink-0">
      <div class="flex items-center gap-2">
        <span class="text-base">{{ weatherIcon }}</span>
        <span class="font-medium text-sm">__T_WEATHER_TITLE__</span>
      </div>
      <div class="flex gap-2">
        <button @click="showSearch = !showSearch" class="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-xs transition-colors">🔍</button>
        <button @click="showCities = !showCities" class="w-7 h-7 rounded-full flex items-center justify-center text-xs transition-colors" :class="showCities ? 'bg-white/30' : 'bg-white/15 hover:bg-white/25'">📌</button>
      </div>
    </div>
    <div v-if="showSearch" class="px-4 pb-2">
      <input v-model="searchQuery" @keydown.enter="doSearch" :placeholder="'__T_WEATHER_SEARCH_PLACEHOLDER__'"
        class="w-full bg-white/10 backdrop-blur border border-white/15 rounded-xl px-3.5 py-2 text-sm placeholder-white/40 outline-none focus:border-white/40" />
      <div v-if="searchResults.length" class="mt-1.5 bg-black/30 backdrop-blur-lg border border-white/10 rounded-xl overflow-hidden">
        <div v-for="city in searchResults" :key="city.lat+city.lon" class="flex items-center justify-between px-3.5 py-2 hover:bg-white/10 cursor-pointer" @click="selectCity(city)">
          <span class="text-sm">{{ city.name }}<span class="text-white/40 text-xs ml-1">{{ city.admin1 ? city.admin1 + ', ' : '' }}{{ city.country }}</span></span>
          <button @click.stop="saveCity(city)" class="text-white/30 hover:text-white text-[10px]">+ __T_WEATHER_SAVE__</button>
        </div>
      </div>
    </div>
    <div v-if="showCities && cities.length" class="px-4 pb-2">
      <div class="flex gap-2 overflow-x-auto pb-1">
        <button v-for="c in cities" :key="c.id" @click="loadForecast(c.lat, c.lon, c.name)"
          class="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-xs whitespace-nowrap shrink-0">
          {{ c.name }} <span @click.stop="removeCity(c.id)" class="text-white/30 hover:text-white/80 ml-0.5">✕</span>
        </button>
      </div>
    </div>
    <div class="flex-1 overflow-y-auto px-4 pb-5">
      <div v-if="loading" class="text-center text-white/40 text-sm py-20">__T_WEATHER_LOADING__</div>
      <div v-else-if="!cw" class="flex flex-col items-center justify-center h-full text-center">
        <div class="text-5xl mb-4 opacity-40">🌤</div>
        <div class="text-white/40 text-sm">__T_WEATHER_EMPTY__</div>
      </div>
      <div v-else>
        <div class="text-center pt-4 pb-6">
          <div class="text-white/60 text-sm font-medium mb-1">{{ cityName }}</div>
          <div class="text-7xl font-extralight leading-none mb-1">{{ Math.round(cw.temp) }}°</div>
          <div class="text-white/90 text-base mb-1">{{ cw.weather }}</div>
          <div class="text-white/40 text-xs">__T_WEATHER_FEELS_LIKE__ {{ Math.round(cw.feelsLike) }}° · __T_WEATHER_HUMIDITY__ {{ cw.humidity }}% · __T_WEATHER_WIND__ {{ cw.windSpeed }}km/h</div>
        </div>
        <div class="mb-4">
          <button @click="doAdvice" :disabled="advising" class="w-full py-2.5 text-xs font-medium rounded-xl transition-all disabled:opacity-30" :class="advising ? 'bg-white/5 text-white/30' : 'bg-white/10 hover:bg-white/15 text-white/70'">
            {{ advising ? '__T_WEATHER_ADVISING__' : '✦ __T_WEATHER_ADVICE__' }}
          </button>
          <div v-if="adviceText" class="mt-2 bg-white/8 border border-white/10 rounded-xl p-3.5 text-sm leading-relaxed text-white/80" v-html="renderMd(adviceText)"></div>
        </div>
        <div class="bg-white/8 border border-white/10 rounded-xl p-4">
          <div class="text-[10px] text-white/30 uppercase tracking-wider mb-3 font-medium">__T_WEATHER_7DAY__</div>
          <div v-for="(day, i) in daily" :key="day.date" class="flex items-center gap-3 py-2" :class="i < daily.length - 1 ? 'border-b border-white/5' : ''">
            <span class="w-9 text-white/50 text-xs font-medium">{{ i === 0 ? '__T_WEATHER_TODAY__' : fmtDay(day.date) }}</span>
            <span class="w-20 text-white/60 text-xs">{{ day.weather }}</span>
            <span class="text-white/30 text-xs w-7 text-right">{{ Math.round(day.tempMin) }}°</span>
            <div class="flex-1 h-[4px] bg-white/5 rounded-full overflow-hidden mx-1">
              <div class="h-full rounded-full" style="background: linear-gradient(90deg, #5bc0de, #ff8c42);" :style="{ width: barW(day.tempMin, day.tempMax) + '%', marginLeft: barOff(day.tempMin) + '%' }"></div>
            </div>
            <span class="text-white text-xs w-7 font-medium">{{ Math.round(day.tempMax) }}°</span>
          </div>
        </div>
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
const loading = ref(false); const showSearch = ref(false); const showCities = ref(false);
const searchQuery = ref(''); const searchResults = ref([]); const cities = ref([]);
const cityName = ref(''); const cw = ref(null); const daily = ref([]);
const advising = ref(false); const adviceText = ref('');
const weatherIcon = computed(() => { const c = cw.value?.weatherCode; if (c == null) return '🌤'; if (c <= 1) return '☀️'; if (c <= 3) return '⛅'; if (c <= 48) return '🌫'; if (c <= 65) return '🌧'; if (c <= 75) return '🌨'; if (c >= 95) return '⛈'; return '🌦'; });
const skyGradient = computed(() => { const c = cw.value?.weatherCode; if (c == null) return 'linear-gradient(180deg,#4a90d9,#357abd)'; if (c <= 1) return 'linear-gradient(180deg,#2980b9,#6dd5fa 50%,#f0c27f)'; if (c <= 3) return 'linear-gradient(180deg,#4a90d9,#74b9ff)'; if (c <= 48) return 'linear-gradient(180deg,#636e72,#b2bec3)'; if (c <= 65) return 'linear-gradient(180deg,#2c3e50,#4ca1af)'; if (c <= 75) return 'linear-gradient(180deg,#3d4e6e,#8e9eab)'; return 'linear-gradient(180deg,#1e272e,#485460)'; });
const allTemps = computed(() => daily.value.flatMap(d => [d.tempMin, d.tempMax]));
const tMin = computed(() => Math.min(...allTemps.value)); const tMax = computed(() => Math.max(...allTemps.value)); const tRange = computed(() => tMax.value - tMin.value || 1);
const barW = (lo, hi) => ((hi - lo) / tRange.value) * 100; const barOff = (lo) => ((lo - tMin.value) / tRange.value) * 100;
const fmtDay = (d) => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(d + 'T00:00:00').getDay()];
const doSearch = async () => { if (!searchQuery.value.trim()) return; try { searchResults.value = (await (await fetch(`/aios/apps/weather/search?q=${encodeURIComponent(searchQuery.value)}`)).json()).cities || []; } catch {} };
const selectCity = (c) => { searchResults.value = []; showSearch.value = false; searchQuery.value = ''; loadForecast(c.lat, c.lon, c.name); };
const loadForecast = async (lat, lon, name) => { loading.value = true; cityName.value = name; adviceText.value = ''; showCities.value = false; try { const d = await (await fetch(`/aios/apps/weather/forecast?lat=${lat}&lon=${lon}`)).json(); cw.value = d.current; daily.value = d.daily || []; } catch {} loading.value = false; };
const loadCities = async () => { try { cities.value = (await (await fetch('/aios/apps/weather/cities')).json()).cities || []; } catch {} };
const saveCity = async (c) => { await fetch('/aios/apps/weather/city', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: c.name, country: c.country, lat: c.lat, lon: c.lon }) }); await loadCities(); };
const removeCity = async (id) => { await fetch('/aios/apps/weather/city/remove', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }); await loadCities(); };
const doAdvice = async () => { advising.value = true; try { adviceText.value = (await (await fetch('/aios/apps/weather/advice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ city: cityName.value, current: cw.value, daily: daily.value, locale: LOCALE }) })).json()).advice || ''; } catch { adviceText.value = 'Failed'; } advising.value = false; };
onMounted(() => loadCities());
</script>
