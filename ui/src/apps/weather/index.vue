<template>
  <div class="flex h-full flex-col text-white overflow-hidden" :style="{ background: skyGradient }" style="font-family: -apple-system, 'PingFang SC', sans-serif;">

    <!-- === Cities list (home) === -->
    <template v-if="view === 'cities'">
      <div class="flex items-center justify-between px-4 py-3 shrink-0">
        <span class="font-semibold text-sm">__T_WEATHER_TITLE__</span>
      </div>
      <div v-if="!cities.length && !citiesLoading" class="flex-1 flex flex-col items-center justify-center text-center px-4 pb-12">
        <div class="text-5xl mb-4 opacity-30">🌤</div>
        <div class="text-white/40 text-sm mb-6">__T_WEATHER_EMPTY__</div>
        <button @click="view = 'search'" class="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-colors text-sm font-medium shadow-sm">
          + __T_WEATHER_ADD_CITY__
        </button>
      </div>
      <div v-else class="flex-1 overflow-y-auto px-4 pb-4">
        <div class="space-y-2.5 pt-1">
          <div v-for="c in cities" :key="c.id"
            class="bg-white/10 backdrop-blur border border-white/10 rounded-2xl p-4 cursor-pointer hover:bg-white/15 transition-all"
            @click="openCity(c)">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-base font-medium">{{ c.name }}</div>
                <div class="text-white/40 text-xs">{{ c.country }}</div>
              </div>
              <div class="text-right">
                <div v-if="cityWeathers[c.id]" class="text-3xl font-light">{{ Math.round(cityWeathers[c.id].temp) }}°</div>
                <div v-if="cityWeathers[c.id]" class="text-white/60 text-xs">{{ cityWeathers[c.id].weather }}</div>
                <div v-else class="text-white/20 text-xs">--</div>
              </div>
            </div>
            <div class="flex items-center justify-between mt-2">
              <div v-if="cityWeathers[c.id]" class="text-white/40 text-[11px]">
                __T_WEATHER_FEELS_LIKE__ {{ Math.round(cityWeathers[c.id].feelsLike) }}° · __T_WEATHER_HUMIDITY__ {{ cityWeathers[c.id].humidity }}%
              </div>
              <button @click.stop="removeCity(c.id)" class="text-white/20 hover:text-red-400 text-xs transition-colors">✕</button>
            </div>
          </div>
        </div>
        <!-- Add button -->
        <button @click="view = 'search'" class="mt-3 w-full py-3 rounded-2xl border border-dashed border-white/15 text-white/40 hover:text-white/70 hover:border-white/30 text-sm transition-all">
          + __T_WEATHER_ADD_CITY__
        </button>
      </div>
    </template>

    <!-- === Search view === -->
    <template v-if="view === 'search'">
      <div class="flex items-center gap-3 px-4 py-3 shrink-0">
        <button @click="view = 'cities'" class="text-white/60 hover:text-white text-sm">← __T_WEATHER_BACK__</button>
        <span class="text-sm font-medium">__T_WEATHER_ADD_CITY__</span>
      </div>
      <div class="px-4 pb-4">
        <input ref="searchInput" v-model="searchQuery" @keydown.enter="doSearch" :placeholder="'__T_WEATHER_SEARCH_PLACEHOLDER__'"
          class="w-full bg-white/10 backdrop-blur border border-white/15 rounded-xl px-4 py-2.5 text-sm placeholder-white/40 outline-none focus:border-white/40 transition-colors" />
      </div>
      <div class="flex-1 overflow-y-auto px-4">
        <div v-if="searching" class="text-center text-white/30 text-sm py-12">__T_WEATHER_LOADING__</div>
        <div v-else-if="searchResults.length" class="space-y-1">
          <div v-for="city in searchResults" :key="city.lat+','+city.lon"
            class="flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer transition-colors"
            @click="addAndOpen(city)">
            <div>
              <div class="text-sm">{{ city.name }}</div>
              <div class="text-white/40 text-xs">{{ city.admin1 ? city.admin1 + ', ' : '' }}{{ city.country }}</div>
            </div>
            <span class="text-white/30 text-xs">+</span>
          </div>
        </div>
        <div v-else-if="searchQuery && !searching" class="text-center text-white/30 text-sm py-12">__T_WEATHER_NO_RESULT__</div>
      </div>
    </template>

    <!-- === Detail view === -->
    <template v-if="view === 'detail'">
      <div class="flex items-center gap-3 px-4 py-3 shrink-0">
        <button @click="view = 'cities'" class="text-white/60 hover:text-white text-sm">← __T_WEATHER_BACK__</button>
      </div>
      <div class="flex-1 overflow-y-auto px-4 pb-5">
        <div v-if="loading" class="text-center text-white/40 text-sm py-16">__T_WEATHER_LOADING__</div>
        <div v-else-if="cw">
          <!-- Current -->
          <div class="text-center pb-6">
            <div class="text-white/60 text-sm font-medium mb-1">{{ cityName }}</div>
            <div class="text-7xl font-extralight leading-none mb-1">{{ Math.round(cw.temp) }}°</div>
            <div class="text-white/90 text-base mb-1">{{ cw.weather }}</div>
            <div class="text-white/40 text-xs">
              __T_WEATHER_FEELS_LIKE__ {{ Math.round(cw.feelsLike) }}° · __T_WEATHER_HUMIDITY__ {{ cw.humidity }}% · __T_WEATHER_WIND__ {{ cw.windSpeed }}km/h
            </div>
          </div>
          <!-- AI Advice -->
          <div class="mb-4">
            <button @click="doAdvice" :disabled="advising"
              class="w-full py-2.5 text-xs font-medium rounded-xl transition-all disabled:opacity-30"
              :class="advising ? 'bg-white/5 text-white/30' : 'bg-white/10 hover:bg-white/15 text-white/70'">
              {{ advising ? '__T_WEATHER_ADVISING__' : '✦ __T_WEATHER_ADVICE__' }}
            </button>
            <div v-if="adviceText" class="mt-2 bg-white/8 border border-white/10 rounded-xl p-3.5 text-sm leading-relaxed text-white/80" v-html="renderMd(adviceText)"></div>
          </div>
          <!-- 7 day -->
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
    </template>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, nextTick } from 'vue';
import { marked } from 'marked';
import { LOCALE } from '../../locale.js';
marked.setOptions({ breaks: true, gfm: true });
const renderMd = (t) => marked.parse(t || '');

const view = ref('cities');
const cities = ref([]); const citiesLoading = ref(false); const cityWeathers = reactive({});
const searchQuery = ref(''); const searchResults = ref([]); const searching = ref(false); const searchInput = ref(null);
const cityName = ref(''); const cw = ref(null); const daily = ref([]); const loading = ref(false);
const advising = ref(false); const adviceText = ref('');

const getWeatherIcon = (code) => { if (code == null) return '🌤'; if (code <= 1) return '☀️'; if (code <= 3) return '⛅'; if (code <= 48) return '🌫'; if (code <= 65) return '🌧'; if (code <= 75) return '🌨'; if (code >= 95) return '⛈'; return '🌦'; };
const skyGradient = computed(() => {
  const c = cw.value?.weatherCode;
  if (view.value !== 'detail' || c == null) return 'linear-gradient(180deg,#4a90d9,#357abd)';
  if (c <= 1) return 'linear-gradient(180deg,#2980b9,#6dd5fa 50%,#f0c27f)';
  if (c <= 3) return 'linear-gradient(180deg,#4a90d9,#74b9ff)';
  if (c <= 48) return 'linear-gradient(180deg,#636e72,#b2bec3)';
  if (c <= 65) return 'linear-gradient(180deg,#2c3e50,#4ca1af)';
  if (c <= 75) return 'linear-gradient(180deg,#3d4e6e,#8e9eab)';
  return 'linear-gradient(180deg,#1e272e,#485460)';
});

const allTemps = computed(() => daily.value.flatMap(d => [d.tempMin, d.tempMax]));
const tMin = computed(() => Math.min(...allTemps.value)); const tMax = computed(() => Math.max(...allTemps.value));
const tRange = computed(() => tMax.value - tMin.value || 1);
const barW = (lo, hi) => ((hi - lo) / tRange.value) * 100;
const barOff = (lo) => ((lo - tMin.value) / tRange.value) * 100;
const fmtDay = (d) => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(d + 'T00:00:00').getDay()];

const loadCities = async () => {
  citiesLoading.value = true;
  try { cities.value = (await (await fetch('/aios/apps/weather/cities')).json()).cities || []; } catch {}
  citiesLoading.value = false;
  // Load weather for each city
  for (const c of cities.value) {
    fetch(`/aios/apps/weather/forecast?lat=${c.lat}&lon=${c.lon}`).then(r => r.json()).then(d => {
      if (d.current) cityWeathers[c.id] = d.current;
    }).catch(() => {});
  }
};

const doSearch = async () => {
  if (!searchQuery.value.trim()) return;
  searching.value = true;
  try { searchResults.value = (await (await fetch(`/aios/apps/weather/search?q=${encodeURIComponent(searchQuery.value)}`)).json()).cities || []; } catch {}
  searching.value = false;
};

const addAndOpen = async (city) => {
  await fetch('/aios/apps/weather/city', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: city.name, country: city.country, lat: city.lat, lon: city.lon }) });
  await loadCities();
  searchQuery.value = ''; searchResults.value = [];
  openCity({ lat: city.lat, lon: city.lon, name: city.name });
};

const openCity = (c) => {
  view.value = 'detail'; loading.value = true; cityName.value = c.name; adviceText.value = ''; cw.value = null; daily.value = [];
  fetch(`/aios/apps/weather/forecast?lat=${c.lat}&lon=${c.lon}`).then(r => r.json()).then(d => {
    cw.value = d.current; daily.value = d.daily || [];
  }).catch(() => {}).finally(() => { loading.value = false; });
};

const removeCity = async (id) => {
  await fetch('/aios/apps/weather/city/remove', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
  await loadCities();
};

const doAdvice = async () => {
  advising.value = true;
  try { adviceText.value = (await (await fetch('/aios/apps/weather/advice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ city: cityName.value, current: cw.value, daily: daily.value, locale: LOCALE }) })).json()).advice || ''; }
  catch { adviceText.value = 'Failed'; } advising.value = false;
};

onMounted(() => loadCities());
</script>
