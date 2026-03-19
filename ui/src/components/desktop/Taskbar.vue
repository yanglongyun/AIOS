<template>
  <div
    class="fixed bottom-0 left-0 right-0 z-[200] flex h-[44px] items-center gap-0 border-t border-[rgba(200,170,130,0.4)] bg-[rgba(250,245,238,0.88)] px-2 shadow-[0_-2px_16px_rgba(90,62,40,0.07)] backdrop-blur-2xl"
    @click="closeLauncher"
  >
    <!-- 应用启动器 -->
    <button
      class="flex h-[34px] w-[40px] flex-shrink-0 items-center justify-center rounded-[8px] border text-[20px] text-[#5a3e28] transition-all"
      :class="launcherOpen
        ? 'border-[rgba(200,160,96,0.4)] bg-[rgba(200,160,96,0.15)]'
        : 'border-transparent hover:border-[rgba(200,160,96,0.25)] hover:bg-[rgba(200,160,96,0.12)]'"
      @click.stop="toggleLauncher"
    >⊞</button>

    <div class="mx-1.5 h-[22px] w-px flex-shrink-0 bg-[rgba(200,160,96,0.22)]"></div>

    <!-- 运行中的窗口标签 -->
    <div class="flex flex-1 items-center gap-1 overflow-hidden px-0.5">
      <button
        v-for="win in windows"
        :key="win.id"
        class="flex h-[32px] min-w-[72px] max-w-[150px] flex-shrink-0 items-center gap-1.5 rounded-[7px] border px-[9px] text-left transition-all"
        :class="win.state === 'minimized'
          ? 'border-transparent opacity-50 hover:border-[rgba(200,160,96,0.2)] hover:bg-[rgba(200,160,96,0.08)] hover:opacity-80'
          : isActive(win)
            ? 'border-[rgba(200,160,96,0.35)] bg-[rgba(200,160,96,0.14)]'
            : 'border-transparent hover:border-[rgba(200,160,96,0.2)] hover:bg-[rgba(200,160,96,0.08)]'"
        @click="clickTab(win)"
      >
        <span class="text-[14px] leading-none">{{ appIcon(win.appId) }}</span>
        <span class="flex-1 truncate text-[12px] text-[#3a2a18]">{{ win.title }}</span>
        <span
          class="h-[5px] w-[5px] flex-shrink-0 rounded-full"
          :class="win.state === 'minimized' ? 'border border-[#c8a060]' : 'bg-[#c8a060]'"
        ></span>
      </button>
    </div>

    <div class="mx-1.5 h-[22px] w-px flex-shrink-0 bg-[rgba(200,160,96,0.22)]"></div>

    <!-- 右侧工具区 -->
    <div class="flex flex-shrink-0 items-center gap-1">
      <!-- 时钟 -->
      <div class="cursor-default px-1.5 text-right">
        <div class="text-[13px] font-semibold leading-[1.25] text-[#3a2a18]">{{ clockTime }}</div>
        <div class="text-[10px] leading-[1.25] text-[#9a8870]">{{ clockDate }}</div>
      </div>

      <div class="mx-1 h-[22px] w-px bg-[rgba(200,160,96,0.22)]"></div>

      <!-- 任务 -->
      <button
        class="relative flex h-[32px] w-[32px] items-center justify-content-center justify-center rounded-[8px] border border-transparent text-[15px] transition-all hover:border-[rgba(200,160,96,0.22)] hover:bg-[rgba(200,160,96,0.1)]"
        @click="openTasks"
      >
        ✅
        <span
          v-if="taskCount > 0"
          class="absolute right-[2px] top-[2px] flex h-[14px] min-w-[14px] items-center justify-center rounded-full border-[1.5px] border-[rgba(250,245,238,0.9)] bg-[#e05030] px-[2px] text-[9px] font-bold text-white"
        >{{ taskCount > 9 ? '9+' : taskCount }}</span>
      </button>

      <!-- AI 对话 -->
      <button
        class="flex h-[32px] items-center gap-1.5 rounded-[8px] bg-gradient-to-br from-[#6a4a30] to-[#4a3020] px-3 text-[12px] font-medium text-[#f0e8d8] shadow-[0_2px_6px_rgba(90,62,40,0.28)] transition-all hover:-translate-y-px hover:shadow-[0_3px_10px_rgba(90,62,40,0.38)]"
        @click="openChat"
      >
        <span class="h-[6px] w-[6px] animate-pulse rounded-full bg-[#c8a060]"></span>
        AI
      </button>
    </div>

    <!-- 启动器面板 -->
    <LauncherPanel
      v-if="launcherOpen"
      @open="onLauncherOpen"
      @close="launcherOpen = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import LauncherPanel from './LauncherPanel.vue';
import { windowManager } from '../../stores/windowManager.js';
import { appRegistry } from '../../desktop/apps.js';
import { useI18n } from '../../i18n/index.js';

const props = defineProps({
  taskCount: { type: Number, default: 0 },
  markRead: { type: Function, default: null },
});

const { t } = useI18n();

const windows = computed(() => windowManager.state.windows);
const launcherOpen = ref(false);

// 时钟
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
onMounted(() => { updateClock(); clockTimer = setInterval(updateClock, 10000); });
onUnmounted(() => clearInterval(clockTimer));

// 图标查找
function appIcon(appId) {
  return appRegistry.find(a => a.id === appId)?.icon || '🪟';
}

// 当前最高 z 的窗口为 active
function isActive(win) {
  const maxZ = Math.max(...windows.value.map(w => w.zIndex));
  return win.zIndex === maxZ && win.state !== 'minimized';
}

// 点击窗口标签
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

// 应用启动器
function toggleLauncher() {
  launcherOpen.value = !launcherOpen.value;
}

function closeLauncher() {
  launcherOpen.value = false;
}

function onLauncherOpen(appId) {
  windowManager.open(appId);
  launcherOpen.value = false;
}

// 右侧按钮
function openTasks() {
  props.markRead?.();
  windowManager.open('tasks');
}

function openChat() {
  windowManager.open('chat');
}
</script>
