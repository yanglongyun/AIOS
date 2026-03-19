<template>
  <div class="flex h-dvh flex-col overflow-hidden bg-[#f5f0e8] font-['Georgia','PingFang_SC',serif]">

    <!-- 顶栏 -->
    <div class="flex h-[52px] shrink-0 items-center border-b border-[#e0d0b8] bg-[rgba(250,245,238,0.97)] px-4 backdrop-blur-xl">
      <button v-if="openedApp" class="mr-3 text-[#5a3e28]" @click="closeApp">
        <span class="text-[20px]">←</span>
      </button>
      <div class="flex-1 text-[15px] font-bold text-[#3a2a18]">{{ topTitle }}</div>
      <span class="text-[13px] text-[#9a8870]">{{ clockTime }}</span>
    </div>

    <!-- 内容区 -->
    <div class="relative min-h-0 flex-1 overflow-hidden">

      <!-- 打开的应用（覆盖所有 tab） -->
      <div v-if="openedApp" class="absolute inset-0 overflow-hidden bg-white">
        <component :is="openedApp.component" v-bind="openedApp.props" />
      </div>

      <!-- 应用网格 -->
      <div v-else-if="activeTab === 'apps'" class="h-full overflow-y-auto px-4 py-4">
        <input
          v-model="appSearch"
          class="mb-4 w-full rounded-[12px] border border-[rgba(200,160,96,0.3)] bg-white px-4 py-2.5 text-[14px] text-[#3a2a18] shadow-sm outline-none placeholder-[#b0a090] focus:border-[#c8a060]"
          :placeholder="t('launcher_search')"
        />
        <div class="grid grid-cols-4 gap-3">
          <button
            v-for="app in filteredApps"
            :key="app.id"
            class="flex flex-col items-center gap-1.5 rounded-[14px] px-1 py-3 transition-colors active:bg-[rgba(200,160,96,0.12)]"
            @click="openApp(app.id)"
          >
            <div class="flex h-[56px] w-[56px] items-center justify-center rounded-[16px] bg-white text-[28px] shadow-[0_2px_8px_rgba(90,62,40,0.1)]">{{ app.icon }}</div>
            <span class="text-center text-[11px] leading-tight text-[#5a4a38]">{{ t(app.name) }}</span>
          </button>
        </div>
      </div>

      <!-- 对话 -->
      <div v-else-if="activeTab === 'chat'" class="flex h-full flex-col overflow-hidden bg-[#1a1410]">
        <MobileChatPanel />
      </div>

      <!-- 任务 -->
      <div v-else-if="activeTab === 'tasks'" class="h-full overflow-y-auto">
        <MobileTaskPanel :task-count="taskCount" />
      </div>

    </div>

    <!-- 底部导航 -->
    <div
      class="shrink-0 border-t border-[#e0d0b8] bg-[rgba(250,245,238,0.97)] backdrop-blur-xl"
      style="padding-bottom: env(safe-area-inset-bottom, 0px)"
    >
      <div class="flex h-[54px] items-stretch">
        <button
          v-for="tab in TABS"
          :key="tab.id"
          class="flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors"
          :class="!openedApp && activeTab === tab.id ? 'text-[#5a3e28]' : 'text-[#b0a090]'"
          @click="switchTab(tab.id)"
        >
          <div class="relative">
            <span class="text-[20px] leading-none">{{ tab.icon }}</span>
            <span
              v-if="tab.id === 'tasks' && taskCount > 0"
              class="absolute -right-[5px] -top-[3px] flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-[#e05030] px-[2px] text-[9px] font-bold text-white"
            >{{ taskCount > 9 ? '9+' : taskCount }}</span>
          </div>
          <span class="text-[10px] font-medium">{{ tab.label }}</span>
          <div
            class="h-[2px] w-[18px] rounded-full transition-colors"
            :class="!openedApp && activeTab === tab.id ? 'bg-[#5a3e28]' : 'bg-transparent'"
          ></div>
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, shallowRef, onMounted, onUnmounted, defineAsyncComponent } from 'vue';
import { appRegistry } from '../desktop/apps.js';
import { useI18n } from '../i18n/index.js';

const { t } = useI18n();

const taskCount = ref(0);
async function fetchTaskCount() {
  try {
    const res = await fetch('/aios/api/tasks/list');
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data.tasks || []);
    taskCount.value = list.filter(t => t.status === 'running' || t.status === 'scheduled').length;
  } catch {}
}

// 时钟
const clockTime = ref('');
function updateClock() {
  const now = new Date();
  clockTime.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}
let clockTimer;
onMounted(() => { updateClock(); clockTimer = setInterval(updateClock, 30000); fetchTaskCount(); });
onUnmounted(() => clearInterval(clockTimer));

// tabs
const TABS = [
  { id: 'apps', icon: '⊞', label: '应用' },
  { id: 'chat', icon: '💬', label: '对话' },
  { id: 'tasks', icon: '✅', label: '任务' },
];

const activeTab = ref('apps');
function switchTab(tabId) {
  openedApp.value = null;
  activeTab.value = tabId;
}

// 顶栏标题
const topTitle = computed(() => {
  if (openedApp.value) {
    const app = appRegistry.find(a => a.id === openedApp.value.appId);
    return app ? t(app.name) : 'AIOS';
  }
  if (activeTab.value === 'chat') return t('mobile_tab_chat');
  if (activeTab.value === 'tasks') return t('mobile_tab_tasks');
  return 'AIOS';
});

// 应用网格
const appSearch = ref('');
const visibleApps = appRegistry.filter(a => !a.hidden);
const filteredApps = computed(() => {
  if (!appSearch.value.trim()) return visibleApps;
  const q = appSearch.value.toLowerCase();
  return visibleApps.filter(a => t(a.name).toLowerCase().includes(q));
});

// 打开的应用
const openedApp = shallowRef(null);
async function openApp(appId) {
  const app = appRegistry.find(a => a.id === appId);
  if (!app) return;
  const mod = await app.load();
  openedApp.value = { appId, component: mod.default, props: {} };
}
function closeApp() {
  openedApp.value = null;
}

// 懒加载移动端子面板
const MobileChatPanel = defineAsyncComponent(() => import('../components/mobile/MobileChatPanel.vue'));
const MobileTaskPanel = defineAsyncComponent(() => import('../components/mobile/MobileTaskPanel.vue'));
</script>
