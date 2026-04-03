<template>
  <div class="flex h-full flex-col bg-gradient-to-b from-[#4a90d9] to-[#357abd] text-white" style="font-family: -apple-system, 'PingFang SC', sans-serif;">
    <div class="flex items-center gap-3 px-4 py-3 shrink-0">
      <span class="text-lg">⛅</span>
      <span class="font-semibold text-sm">__T_WEATHER_TITLE__</span>
      <div class="ml-auto flex gap-2">
        <button @click="showSearch = !showSearch" class="px-2.5 py-1 text-xs rounded-full bg-white/15 hover:bg-white/25 transition-colors">🔍 __T_WEATHER_SEARCH__</button>
        <button @click="showCities = !showCities" class="px-2.5 py-1 text-xs rounded-full transition-colors" :class="showCities ? 'bg-white/30' : 'bg-white/15 hover:bg-white/25'">★ {{ cities.length }}</button>
      </div>
    </div>
    <div v-if="showSearch" class="px-4 pb-3">
      <input v-model="searchQuery" @keydown.enter="doSearch" :placeholder="'__T_WEATHER_SEARCH_PLACEHOLDER__'" class="w-full bg-white/15 border border-white/20 rounded-lg px-3 py-2 text-sm placeholder-white/50 outline-none focus:border-white/40" />
      <div v-if="searchResults.length" class="mt-2 bg-[#2a6cb5] border border-white/15 rounded-lg overflow-hidden">
        <div v-for="city in searchResults" :key="city.lat+','+city.lon" class="flex items-center justify-between px-3 py-2 hover:bg-white/10 cursor-pointer transition-colors" @click="selectCity(city)">
          <div><span class="text-sm">{{ city.name }}</span><span class="text-white/50 text-xs ml-1">{{ city.admin1 ? city.admin1 + ', ' : '' }}{{ city.country }}</span></div>
          <button @click.stop="saveCity(city)" class="text-white/40 hover:text-white text-xs">+ __T_WEATHER_SAVE__</button>
        </div>
      </div>
    </div>
    <div v-if="showCities && cities.length" class="px-4 pb-3">
      <div class="bg-[#2a6cb5] border border-white/15 rounded-lg overflow-hidden">
        <div v-for="city in cities" :key="city.id" class="flex items-center justify-between px-3 py-2 hover:bg-white/10 cursor-pointer transition-colors" @click="loadForecast(city.lat, city.lon, city.name)">
          <span class="text-sm">{{ city.name }} <span class="text-white/50 text-xs">{{ city.country }}</span></span>
          <button @click.stop="removeCity(city.id)" class="text-white/40 hover:text-red-300 text-xs">✕</button>
        </div>
      </div>
    </div>
    <div class="flex-1 overflow-y-auto px-4 pb-4">
      <div v-if="loading" class="text-center text-white/50 text-sm py-12">__T_WEATHER_LOADING__</div>
      <div v-else-if="!currentWeather" class="text-center text-white/50 text-sm py-12">__T_WEATHER_EMPTY__</div>
      <div v-else>
        <div class="text-center mb-6">
          <div class="text-white/60 text-sm mb-1">{{ cityName }}</div>
          <div class="text-6xl font-light mb-1">{{ Math.round(currentWeather.temp) }}°</div>
          <div class="text-white/80 text-sm">{{ currentWeather.weather }}</div>
          <div class="text-white/50 text-xs mt-1">__T_WEATHER_FEELS_LIKE__ {{ Math.round(currentWeather.feelsLike) }}° · __T_WEATHER_HUMIDITY__ {{ currentWeather.humidity }}% · __T_WEATHER_WIND__ {{ currentWeather.windSpeed }} km/h</div>
        </div>
        <div class="mb-4">
          <button @click="doAdvice" :disabled="advising" class="w-full px-3 py-2 text-xs rounded-lg bg-white/15 hover:bg-white/25 disabled:opacity-40 transition-colors text-center">
            {{ advising ? '__T_WEATHER_ADVISING__' : '✦ __T_WEATHER_ADVICE__' }}
          </button>
          <div v-if="adviceText" class="mt-2 bg-white/10 border border-white/15 rounded-lg p-3 text-sm leading-relaxed text-white/80 whitespace-pre-wrap">{{ adviceText }}</div>
        </div>
        <div class="bg-white/10 border border-white/15 rounded-lg p-3">
          <div class="text-[11px] text-white/40 uppercase mb-3">__T_WEATHER_7DAY__</div>
          <div class="space-y-2">
            <div v-for="(day, i) in dailyForecast" :key="day.date" class="flex items-center gap-3 text-sm">
              <span class="w-10 text-white/50 text-xs">{{ i === 0 ? '__T_WEATHER_TODAY__' : formatDay(day.date) }}</span>
              <span class="flex-1 text-white/70 text-xs">{{ day.weather }}</span>
              <span class="text-white/40 text-xs w-8 text-right">{{ Math.round(day.tempMin) }}°</span>
              <div class="w-20 h-1 bg-white/10 rounded-full overflow-hidden"><div class="h-full rounded-full bg-gradient-to-r from-[#4ecca3] to-[#ff6b6b]" :style="{ width: tempBarWidth(day.tempMin, day.tempMax) + '%', marginLeft: tempBarOffset(day.tempMin) + '%' }"></div></div>
              <span class="text-white text-xs w-8">{{ Math.round(day.tempMax) }}°</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { chatPanel } from '../../stores/chatPanel.js';
import { LOCALE } from '../../locale.js';
const loading = ref(false); const showSearch = ref(false); const showCities = ref(false);
const searchQuery = ref(''); const searchResults = ref([]); const cities = ref([]);
const cityName = ref(''); const currentWeather = ref(null); const dailyForecast = ref([]);
const advising = ref(false); const adviceText = ref('');
const allTemps = computed(() => dailyForecast.value.flatMap(d => [d.tempMin, d.tempMax]));
const tempMin = computed(() => Math.min(...allTemps.value)); const tempMax = computed(() => Math.max(...allTemps.value));
const tempRange = computed(() => tempMax.value - tempMin.value || 1);
const tempBarWidth = (min, max) => ((max - min) / tempRange.value) * 100;
const tempBarOffset = (min) => ((min - tempMin.value) / tempRange.value) * 100;
const formatDay = (d) => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(d+'T00:00:00').getDay()];
const doSearch = async () => { if (!searchQuery.value.trim()) return; try { const res = await fetch(`/aios/apps/weather/search?q=${encodeURIComponent(searchQuery.value)}`); const data = await res.json(); searchResults.value = data.cities || []; } catch {} };
const selectCity = (city) => { searchResults.value = []; showSearch.value = false; searchQuery.value = ''; loadForecast(city.lat, city.lon, city.name); };
const loadForecast = async (lat, lon, name) => { loading.value = true; cityName.value = name; adviceText.value = ''; showCities.value = false; try { const res = await fetch(`/aios/apps/weather/forecast?lat=${lat}&lon=${lon}`); const data = await res.json(); currentWeather.value = data.current || null; dailyForecast.value = data.daily || []; } catch {} loading.value = false; };
const loadCities = async () => { try { const res = await fetch('/aios/apps/weather/cities'); const data = await res.json(); cities.value = data.cities || []; } catch {} };
const saveCity = async (city) => { await fetch('/aios/apps/weather/city', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: city.name, country: city.country, lat: city.lat, lon: city.lon }) }); await loadCities(); };
const removeCity = async (id) => { await fetch('/aios/apps/weather/city/remove', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }); await loadCities(); };
const doAdvice = async () => { if (!currentWeather.value) return; advising.value = true; try { const res = await fetch('/aios/apps/weather/advice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ city: cityName.value, current: currentWeather.value, daily: dailyForecast.value, locale: LOCALE }) }); const data = await res.json(); adviceText.value = data.advice || ''; } catch { adviceText.value = 'Failed'; } advising.value = false; };
onMounted(() => { loadCities(); chatPanel.setContext({ scene: 'weather', label: '__T_APP_SIDEBAR_WEATHER__' }); chatPanel.setQuickMessages(['__T_WEATHER_CHAT_QUICK_1__', '__T_WEATHER_CHAT_QUICK_2__', '__T_WEATHER_CHAT_QUICK_3__']); });
</script>
