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
        :class="selectedId === app.id ? iconSelectedClass : iconIdleClass"
        @click.stop="selectIcon(app.id)"
        @dblclick.stop="openApp(app.id)"
      >
        <span class="text-[26px] transition-transform duration-200" :class="{ '-translate-y-0.5': selectedId !== app.id }">{{ app.icon }}</span>
        <span class="line-clamp-2 max-w-[80px] text-center text-[11px] font-semibold leading-tight break-words" :class="iconLabelClass">{{ app.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { apps, getApp } from '../../apps.js';
import { windowManager } from '../../system/windows.js';
import { currentWallpaper, desktopTheme, setWallpaper as applyWallpaper, wallpaperId } from '../../stores/appearance.js';

defineEmits(['contextmenu']);

const visibleApps = computed(() => apps);
const selectedId = ref(null);
const currentWp = currentWallpaper;
const isUrlWallpaper = computed(() => currentWp.value.type === 'url');
const hasWallpaperEffect = computed(() => isUrlWallpaper.value && !!currentWp.value.effect);
const wallpaperClass = computed(() => currentWp.value.type === 'css' ? currentWp.value.id : '');
const iconIdleClass = computed(() => desktopTheme.value === 'dark' ? 'hover:bg-white/[0.08]' : 'hover:bg-white/50');
const iconSelectedClass = computed(() => desktopTheme.value === 'dark'
  ? 'bg-white/[0.12] ring-1 ring-white/[0.22]'
  : 'bg-black/[0.08] ring-1 ring-black/[0.18]');
const iconLabelClass = computed(() => desktopTheme.value === 'dark'
  ? 'text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.72)]'
  : 'text-[#222] [text-shadow:0_1px_4px_rgba(255,255,255,0.9)]');
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
  const app = getApp(id);
  if (app) {
    windowManager.openWindow(app);
  }
  selectedId.value = null;
}

function onDesktopClick() {
  selectedId.value = null;
}

function setWallpaper(id) {
  applyWallpaper(id);
}

defineExpose({ setWallpaper, wallpaper: wallpaperId });
</script>

<style scoped>
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
