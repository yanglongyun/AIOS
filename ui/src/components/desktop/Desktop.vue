<template>
  <div
    class="desktop relative h-[calc(100dvh-44px)] w-screen transition-[background] duration-500"
    :class="wallpaperClass"
    :style="wallpaperStyle"
    @click="onDesktopClick"
    @contextmenu.prevent="$emit('contextmenu', $event)"
  >
    <div v-if="hasWallpaperEffect" class="absolute inset-0 overflow-hidden">
      <div class="wallpaper-image-layer" :style="wallpaperImageStyle"></div>
      <div class="wallpaper-overlay-layer" :style="wallpaperOverlayStyle"></div>
      <div class="wallpaper-glass-layer" :style="wallpaperGlassStyle"></div>
    </div>

    <div class="desktop-icons absolute inset-6 z-[1]">
      <div
        v-for="app in visibleApps"
        :key="app.id"
        class="flex cursor-pointer select-none flex-col items-center gap-1.5 rounded-[10px] px-1 py-2 transition-all duration-150 active:scale-95"
        :class="selectedId === app.id ? 'bg-[rgba(224,136,80,0.12)] outline outline-[1.5px] outline-[rgba(224,136,80,0.3)]' : 'hover:bg-white/35'"
        @click.stop="selectIcon(app.id)"
        @dblclick.stop="openApp(app.id)"
      >
        <span class="text-[26px] transition-transform duration-200" :class="{ '-translate-y-0.5': selectedId !== app.id }">{{ app.icon }}</span>
        <span class="max-w-[80px] truncate text-center text-[11px] font-medium leading-tight text-[#2c2420] [text-shadow:0_1px_3px_rgba(255,255,255,0.8)]">{{ app.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { appRegistry } from '../../apps.js';
import { windowManager } from '../../stores/windowManager.js';
import { wallpaperList } from './wallpapers.js';

defineEmits(['contextmenu']);

const visibleApps = computed(() => appRegistry.filter(a => !a.hidden));
const selectedId = ref(null);
const wallpaperId = ref(localStorage.getItem('aios-wallpaper') || 'wp-sea-mist-blue-bay');

const currentWp = computed(() => wallpaperList.find(w => w.id === wallpaperId.value) || wallpaperList[0]);
const isUrlWallpaper = computed(() => currentWp.value.type === 'url');
const hasWallpaperEffect = computed(() => isUrlWallpaper.value && !!currentWp.value.effect);
const wallpaperClass = computed(() => currentWp.value.type === 'css' ? currentWp.value.id : '');
const wallpaperStyle = computed(() => {
  if (currentWp.value.type !== 'url') return {};
  if (!currentWp.value.effect) {
    return {
      backgroundImage: `url(${currentWp.value.url})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    };
  }
  return {
    backgroundColor: currentWp.value.effect?.backgroundColor || '#d8e1e6'
  };
});
const wallpaperImageStyle = computed(() => {
  if (currentWp.value.type !== 'url' || !currentWp.value.effect) return {};
  const effect = currentWp.value.effect || {};
  return {
    backgroundImage: `url(${currentWp.value.url})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    opacity: effect.imageOpacity ?? 0.85,
    filter: `blur(${effect.blur || '18px'}) saturate(1.04) brightness(1.06)`,
    transform: `scale(${effect.scale || 1.05})`
  };
});
const wallpaperOverlayStyle = computed(() => {
  if (currentWp.value.type !== 'url' || !currentWp.value.effect) return {};
  return {
    background: currentWp.value.effect?.overlay || 'transparent'
  };
});
const wallpaperGlassStyle = computed(() => {
  if (currentWp.value.type !== 'url' || !currentWp.value.effect) return {};
  const effect = currentWp.value.effect || {};
  return {
    backgroundImage: [effect.glass, effect.vignette].filter(Boolean).join(', ')
  };
});
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
.wp-sea-mist-blue-bay {
  background-color: #b9ccda;
  background-image:
    radial-gradient(ellipse at 50% 12%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.12) 34%, transparent 64%),
    radial-gradient(ellipse at 50% 68%, rgba(104,150,176,0.34) 0%, rgba(104,150,176,0.08) 28%, transparent 62%),
    linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.02) 46%, rgba(74,124,156,0.1) 100%),
    linear-gradient(180deg, #dfeaf1 0%, #c7d8e3 42%, #adc4d3 74%, #90adc0 100%);
}

.wp-morning-sandbar {
  background-color: #e5ccb2;
  background-image:
    radial-gradient(ellipse at 50% 14%, rgba(255,255,255,0.36) 0%, rgba(255,248,235,0.14) 30%, transparent 60%),
    linear-gradient(180deg, transparent 0%, transparent 60%, rgba(255,243,221,0.2) 61%, rgba(255,243,221,0.08) 70%, transparent 78%),
    radial-gradient(ellipse at 50% 84%, rgba(224,192,146,0.28) 0%, rgba(224,192,146,0.06) 34%, transparent 68%),
    linear-gradient(180deg, #f8f0e3 0%, #efdcc1 38%, #dfc09a 72%, #c6a177 100%);
}

.wp-forest-mist {
  background-color: #9fb4a3;
  background-image:
    radial-gradient(ellipse at 50% 10%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.08) 28%, transparent 58%),
    radial-gradient(ellipse at 18% 72%, rgba(120,149,126,0.38) 0%, rgba(120,149,126,0.06) 34%, transparent 70%),
    radial-gradient(ellipse at 52% 64%, rgba(85,116,95,0.4) 0%, rgba(85,116,95,0.08) 28%, transparent 62%),
    radial-gradient(ellipse at 86% 70%, rgba(110,138,116,0.32) 0%, rgba(110,138,116,0.07) 30%, transparent 66%),
    linear-gradient(180deg, #e3ece5 0%, #c8d8cc 40%, #99b19f 76%, #75917c 100%);
}

.wp-silver-cyan-lake {
  background-color: #aac2cf;
  background-image:
    radial-gradient(ellipse at 50% 16%, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.12) 30%, transparent 62%),
    linear-gradient(180deg, transparent 0%, transparent 60%, rgba(244,250,252,0.18) 61%, rgba(244,250,252,0.08) 68%, transparent 76%),
    radial-gradient(ellipse at 50% 78%, rgba(110,166,194,0.34) 0%, rgba(110,166,194,0.06) 34%, transparent 68%),
    linear-gradient(180deg, #e6eef2 0%, #cddbe2 42%, #a6bfca 75%, #84a3b4 100%);
}

.wp-dusk-rock-shore {
  background-color: #5f6a7d;
  background-image:
    radial-gradient(ellipse at 50% 12%, rgba(214,222,242,0.2) 0%, rgba(214,222,242,0.05) 30%, transparent 62%),
    radial-gradient(ellipse at 20% 72%, rgba(88,103,128,0.3) 0%, rgba(88,103,128,0.08) 34%, transparent 70%),
    radial-gradient(ellipse at 82% 76%, rgba(62,73,94,0.36) 0%, rgba(62,73,94,0.08) 34%, transparent 70%),
    linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 36%, rgba(18,24,38,0.1) 100%),
    linear-gradient(180deg, #8f9cb0 0%, #758196 38%, #596377 72%, #3c4456 100%);
}

.wp-linen-warm-paper {
  background-color: #ddd0bc;
  background-image:
    repeating-linear-gradient(0deg, rgba(110,96,78,0.035) 0px, rgba(110,96,78,0.035) 1px, transparent 1px, transparent 5px),
    repeating-linear-gradient(90deg, rgba(110,96,78,0.03) 0px, rgba(110,96,78,0.03) 1px, transparent 1px, transparent 5px),
    radial-gradient(ellipse at 50% 14%, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0.08) 34%, transparent 62%),
    linear-gradient(180deg, #f1eadf 0%, #e3d7c7 46%, #d0bea8 100%);
}

.wp-amber-clouds {
  background-color: #d8ab8a;
  background-image:
    radial-gradient(ellipse at 22% 24%, rgba(255,242,230,0.34) 0%, rgba(255,242,230,0.08) 34%, transparent 64%),
    radial-gradient(ellipse at 58% 18%, rgba(255,224,202,0.28) 0%, rgba(255,224,202,0.07) 30%, transparent 58%),
    radial-gradient(ellipse at 84% 30%, rgba(235,183,146,0.24) 0%, rgba(235,183,146,0.05) 30%, transparent 58%),
    linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 38%, rgba(132,74,42,0.06) 100%),
    linear-gradient(180deg, #f3ddcf 0%, #ebbfa5 42%, #d79f80 74%, #b77758 100%);
}

.wp-snowlight-peak {
  background-color: #b8cedd;
  background-image:
    radial-gradient(ellipse at 50% 10%, rgba(255,255,255,0.52) 0%, rgba(255,255,255,0.14) 28%, transparent 58%),
    linear-gradient(180deg, transparent 0%, transparent 62%, rgba(247,251,255,0.2) 63%, rgba(247,251,255,0.08) 70%, transparent 78%),
    radial-gradient(ellipse at 18% 82%, rgba(163,191,214,0.26) 0%, rgba(163,191,214,0.05) 36%, transparent 70%),
    radial-gradient(ellipse at 84% 84%, rgba(120,155,184,0.22) 0%, rgba(120,155,184,0.05) 32%, transparent 66%),
    linear-gradient(180deg, #eef5fa 0%, #dbe8f1 42%, #b8cfdf 76%, #8eb0c5 100%);
}

.wallpaper-image-layer,
.wallpaper-overlay-layer,
.wallpaper-glass-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.wallpaper-image-layer {
  transform-origin: center;
  will-change: transform, filter;
}

.wallpaper-overlay-layer {
  opacity: 0.72;
}

.wallpaper-glass-layer {
  mix-blend-mode: screen;
  opacity: 1;
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
