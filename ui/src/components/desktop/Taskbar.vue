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

    <button
      class="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-[8px] border transition-all"
      :class="taskCenterOpen
        ? 'border-[rgba(200,160,96,0.4)] bg-[rgba(200,160,96,0.15)]'
        : 'border-transparent hover:border-[rgba(200,160,96,0.25)] hover:bg-[rgba(200,160,96,0.12)]'"
      @click.stop="toggleTaskCenter"
    >
      <ListTodo class="h-[15px] w-[15px] text-[#5a3e28]" />
    </button>

    <div class="mx-1 h-[22px] w-px flex-shrink-0 bg-[rgba(200,160,96,0.22)]"></div>

    <!-- 时钟（最右侧） -->
    <div class="flex-shrink-0 cursor-default px-1.5 text-right">
      <div class="text-[13px] font-semibold leading-[1.25] text-[#3a2a18]">{{ clockTime }}</div>
      <div class="text-[10px] leading-[1.25] text-[#9a8870]">{{ clockDate }}</div>
    </div>

    <!-- 任务中心面板 -->
    <TaskCenter v-if="taskCenterOpen" @close="taskCenterOpen = false" />

    <!-- 启动器面板 -->
    <LauncherPanel
      v-if="launcherOpen"
      @open="onLauncherOpen"
      @close="launcherOpen = false"
      @create-app="onCreateApp"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ListTodo } from 'lucide-vue-next';
import LauncherPanel from './LauncherPanel.vue';
import TaskCenter from './TaskCenter.vue';
import { windowManager } from '../../stores/windowManager.ts';
import { appRegistry } from '../../apps.ts';
import { useI18n } from '../../i18n/index.ts';

const { t } = useI18n();

const windows = computed(() => windowManager.state.windows);
const launcherOpen = ref(false);
const taskCenterOpen = ref(false);

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

// 任务中心
function toggleTaskCenter() {
  taskCenterOpen.value = !taskCenterOpen.value;
  if (taskCenterOpen.value) launcherOpen.value = false;
}

// 应用启动器
function toggleLauncher() {
  launcherOpen.value = !launcherOpen.value;
  if (launcherOpen.value) taskCenterOpen.value = false;
}

function closeLauncher() {
  launcherOpen.value = false;
  taskCenterOpen.value = false;
}

function onLauncherOpen(appId) {
  windowManager.open(appId);
  launcherOpen.value = false;
}

function onCreateApp() {
  windowManager.open('create-app');
  launcherOpen.value = false;
}

</script>
