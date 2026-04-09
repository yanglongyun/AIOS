<template>
  <div
    class="fixed bottom-0 left-0 right-0 z-[1000] flex h-[44px] items-center gap-0 border-t px-2 backdrop-blur-2xl"
    :class="barClass"
  >
    <button
      ref="launcherButtonEl"
      class="flex h-[34px] w-[40px] flex-shrink-0 items-center justify-center rounded-[8px] border transition-all"
      :class="launcherOpen
        ? launcherActiveClass
        : launcherIdleClass"
      @click.stop="$emit('toggle-launcher')"
    >
      <LayoutGrid class="h-[16px] w-[16px]" :stroke-width="1.8" />
    </button>

    <div class="mx-1.5 h-[22px] w-px flex-shrink-0" :class="dividerClass"></div>

    <div class="flex flex-1 items-center gap-1 overflow-hidden px-0.5">
      <button
        v-for="win in windows"
        :key="win.id"
        class="flex h-[32px] min-w-[72px] max-w-[150px] flex-shrink-0 items-center gap-1.5 rounded-[7px] border px-[9px] text-left transition-all"
        :class="win.state === 'minimized'
          ? minimizedClass
          : isActive(win)
            ? activeTabClass
            : idleTabClass"
        @click="clickTab(win)"
      >
        <span class="text-[14px] leading-none">{{ appIcon(win.appId) }}</span>
        <span class="flex-1 truncate text-[12px] font-medium" :class="titleClass">{{ win.title }}</span>
      </button>
    </div>

    <div class="mx-1.5 h-[22px] w-px flex-shrink-0" :class="dividerClass"></div>

    <div class="flex-shrink-0 cursor-default px-1.5 text-right">
      <div class="text-[13px] font-semibold leading-[1.25]" :class="titleClass">{{ clockTime }}</div>
      <div class="text-[10px] leading-[1.25]" :class="subtleTextClass">{{ clockDate }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { LayoutGrid } from 'lucide-vue-next';
import { windowManager } from '../../system/windows.js';
import { getApp } from '../../apps.js';
import { desktopTheme } from '../../stores/appearance.js';

defineProps({
  launcherOpen: { type: Boolean, default: false }
});

defineEmits(['toggle-launcher']);

const windows = computed(() => windowManager.state.windows);
const launcherButtonEl = ref(null);
const isDarkTheme = computed(() => desktopTheme.value === 'dark');
const barClass = computed(() => isDarkTheme.value
  ? 'border-white/[0.08] bg-[#0f1322]/[0.82] shadow-[0_-1px_0_rgba(255,255,255,0.03)]'
  : 'border-black/[0.07] bg-white/[0.88] shadow-[0_-1px_0_rgba(0,0,0,0.04)]');
const launcherIdleClass = computed(() => isDarkTheme.value
  ? 'border-transparent text-white hover:border-white/[0.1] hover:bg-white/[0.08]'
  : 'border-transparent text-[#222] hover:border-black/[0.09] hover:bg-black/[0.05]');
const launcherActiveClass = computed(() => isDarkTheme.value
  ? 'border-white/[0.14] bg-white/[0.1] text-white'
  : 'border-black/[0.14] bg-black/[0.07] text-[#222]');
const dividerClass = computed(() => isDarkTheme.value ? 'bg-white/[0.08]' : 'bg-black/[0.07]');
const minimizedClass = computed(() => isDarkTheme.value
  ? 'border-transparent opacity-45 hover:border-white/[0.08] hover:bg-white/[0.06] hover:opacity-75'
  : 'border-transparent opacity-40 hover:border-black/[0.07] hover:bg-black/[0.04] hover:opacity-70');
const activeTabClass = computed(() => isDarkTheme.value
  ? 'border-white/[0.12] bg-white/[0.1]'
  : 'border-black/[0.12] bg-black/[0.06]');
const idleTabClass = computed(() => isDarkTheme.value
  ? 'border-transparent hover:border-white/[0.08] hover:bg-white/[0.06]'
  : 'border-transparent hover:border-black/[0.07] hover:bg-black/[0.04]');
const titleClass = computed(() => isDarkTheme.value ? 'text-white' : 'text-[#222]');
const subtleTextClass = computed(() => isDarkTheme.value ? 'text-white/45' : 'text-black/[0.38]');

const clockTime = ref('');
const clockDate = ref('');

function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  clockTime.value = `${h}:${m}`;
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  clockDate.value = `${now.getMonth() + 1}/${now.getDate()} ${days[now.getDay()]}`;
}

let clockTimer;
onMounted(() => {
  updateClock();
  clockTimer = setInterval(updateClock, 10000);
});
onUnmounted(() => {
  clearInterval(clockTimer);
});

function appIcon(appId) {
  return getApp(appId)?.icon || '🪟';
}

function isActive(win) {
  const maxZ = Math.max(...windows.value.map(w => w.zIndex));
  return win.zIndex === maxZ && win.state !== 'minimized';
}

function clickTab(win) {
  if (win.state === 'minimized') {
    win.state = 'normal';
    windowManager.focus(win.id);
  } else if (isActive(win)) {
    windowManager.minimize(win.id);
  } else {
    windowManager.focus(win.id);
  }
}

defineExpose({ launcherButtonEl });
</script>
