<template>
  <div
    class="desktop relative h-[100dvh] w-screen transition-[background] duration-500"
    :class="wallpaperClass"
    :style="wallpaperStyle"
    @click="onDesktopClick"
    @contextmenu.prevent="$emit('contextmenu', $event)"
  >
    <div class="desktop-icons absolute inset-6">
      <div
        v-for="app in visibleApps"
        :key="app.id"
        class="flex cursor-pointer select-none flex-col items-center gap-1.5 rounded-[10px] px-1 py-2 transition-all duration-150 active:scale-95"
        :class="selectedId === app.id ? 'bg-[rgba(224,136,80,0.12)] outline outline-[1.5px] outline-[rgba(224,136,80,0.3)]' : 'hover:bg-white/35'"
        @click.stop="selectIcon(app.id)"
        @dblclick.stop="openApp(app.id)"
      >
        <span class="text-[26px] transition-transform duration-200" :class="{ '-translate-y-0.5': selectedId !== app.id }">{{ app.icon }}</span>
        <span class="max-w-[80px] truncate text-center text-[11px] font-medium leading-tight text-[#2c2420] [text-shadow:0_1px_3px_rgba(255,255,255,0.8)]"
          :class="{ 'text-white/90 [text-shadow:0_1px_4px_rgba(0,0,0,0.6)]': isDarkWallpaper }"
        >{{ t(app.name) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { appRegistry } from '../../desktop/apps.js';
import { windowManager } from '../../stores/windowManager.js';
import { useI18n } from '../../i18n/index.js';
import { wallpaperList } from '../../desktop/wallpapers.js';

const { t } = useI18n();

defineEmits(['contextmenu']);

const visibleApps = computed(() => appRegistry.filter(a => !a.hidden));
const selectedId = ref(null);
const wallpaperId = ref(localStorage.getItem('aios-wallpaper') || 'wp-warm-morning');

const currentWp = computed(() => wallpaperList.find(w => w.id === wallpaperId.value) || wallpaperList[0]);
const wallpaperClass = computed(() => currentWp.value.type === 'css' ? currentWp.value.id : '');
const wallpaperStyle = computed(() => {
  if (currentWp.value.type !== 'url') return {};
  return {
    backgroundImage: `url(${currentWp.value.url})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  };
});
const isDarkWallpaper = computed(() => !!currentWp.value.dark);

function selectIcon(id) {
  selectedId.value = id;
}

function openApp(id) {
  windowManager.open(id);
  selectedId.value = null;
}

function onDesktopClick() {
  selectedId.value = null;
}

function setWallpaper(id) {
  wallpaperId.value = id;
  localStorage.setItem('aios-wallpaper', id);
}

defineExpose({ setWallpaper, wallpaper: wallpaperId });
</script>

<style scoped>
/* 渐变壁纸 — 必须原生 */
.wp-warm-morning  { background: linear-gradient(135deg, #fdf5e6 0%, #f5e0c3 30%, #e8c9a0 60%, #d4a574 100%); }
.wp-soft-lavender { background: linear-gradient(135deg, #f0e6f6 0%, #e0d0f0 30%, #c9b8e8 60%, #b8a0d8 100%); }
.wp-ocean-breeze  { background: linear-gradient(135deg, #e6f2f8 0%, #c8dfe8 30%, #a0c8d8 60%, #78b0c8 100%); }
.wp-forest-mist   { background: linear-gradient(135deg, #e8f0e6 0%, #c8d8c0 30%, #a8c8a0 60%, #88b880 100%); }
.wp-sunset-glow   { background: linear-gradient(135deg, #fef0e6 0%, #fdd8c0 30%, #f0b898 60%, #e89870 100%); }

/* 纹理壁纸 — 必须原生 */
.wp-wood {
  background-color: #b8884c;
  background-image:
    repeating-linear-gradient(82deg, rgba(0,0,0,0) 0, rgba(0,0,0,0.03) 1px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 7px),
    repeating-linear-gradient(0deg, rgba(100,60,20,0.08) 0, transparent 2px, transparent 24px),
    linear-gradient(180deg, #c89858 0%, #b88848 30%, #a87838 60%, #c09050 100%);
}

.wp-linen {
  background-color: #e4d8c8;
  background-image:
    repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 4px),
    repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(0,0,0,0.025) 3px, rgba(0,0,0,0.025) 4px),
    linear-gradient(160deg, #ece0d0 0%, #ddd0be 50%, #e4d8c8 100%);
}

.wp-dark-stone {
  background-color: #2a2a2e;
  background-image:
    radial-gradient(ellipse at 15% 60%, rgba(60,58,65,0.6) 0%, transparent 50%),
    radial-gradient(ellipse at 75% 25%, rgba(55,50,58,0.5) 0%, transparent 45%),
    radial-gradient(ellipse at 50% 80%, rgba(45,42,50,0.4) 0%, transparent 55%),
    url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.12'/%3E%3C/svg%3E");
}

/* grid 纵向排列 — Tailwind 不支持 grid-auto-flow: column */
.desktop-icons {
  display: grid;
  grid-template-columns: repeat(auto-fill, 80px);
  grid-template-rows: repeat(auto-fill, 90px);
  grid-auto-flow: column;
  gap: 6px 16px;
  align-content: start;
}
</style>
