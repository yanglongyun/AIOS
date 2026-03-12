<template>
  <div v-if="!ready" class="h-[100dvh] w-screen bg-[#1a1410]"></div>

  <RouterView v-else-if="isAuthRoute" />

  <div v-else class="flex h-[100dvh] w-screen flex-col overflow-hidden bg-[#2a2218] font-['Georgia','PingFang_SC',serif]">

    <!-- 顶部栏 -->
    <div class="relative z-[80] flex h-12 shrink-0 items-center gap-3.5 border-b-2 border-[#3a2010] bg-[linear-gradient(180deg,#5a3e28_0%,#4a3020_100%)] px-4 shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
      <button @click="sidebarOpen = !sidebarOpen" class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-white/10 bg-white/10 text-[#d4c0a0] transition-all hover:bg-white/15 hover:text-[#f0e0c0]">
        <Menu class="h-[14px] w-[14px]" />
      </button>
      <span class="text-base font-bold tracking-[0.12em] text-[#e8d4b8] [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">AIOS</span>
      <div class="ml-auto flex items-center gap-2">
        <!-- 任务 -->
        <button :title="t('app_top_tasks')" @click="togglePanel('tasks')" class="relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-white/10 bg-white/10 text-[#d4c0a0] transition-all hover:bg-white/15 hover:text-[#f0e0c0]">
          <LoaderCircle class="h-[14px] w-[14px]" :class="{ 'animate-spin': hasPending }" />
          <span v-if="taskCount > 0" class="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#c8a060] px-0.5 text-[9px] font-bold text-[#2a1a0a]">{{ taskCount > 99 ? '99+' : taskCount }}</span>
        </button>
        <!-- 对话 -->
        <button :title="t('app_top_chat')" @click="togglePanel('chat')" class="relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-white/10 bg-white/10 text-[#d4c0a0] transition-all hover:bg-white/15 hover:text-[#f0e0c0]" :class="activePanel === 'chat' ? 'bg-white/20 text-[#f0e0c0]' : ''">
          <MessageSquare class="h-[14px] w-[14px]" />
        </button>
      </div>
    </div>

    <TasksPanel
      v-if="activePanel === 'tasks'"
      :tasks="tasks"
      @close="activePanel = null"
    />

    <ChatSidePanel
      v-if="activePanel === 'chat'"
      :context="currentAppContext"
      @close="activePanel = null"
    />

    <!-- 下方：导航面板 + 内容区 -->
    <div class="relative flex min-h-0 flex-1">
      <div v-if="sidebarOpen" @click="sidebarOpen = false" class="fixed inset-0 z-[60] hidden bg-[rgba(22,14,8,0.45)] backdrop-blur-[1px] max-md:block" />
      <div v-show="sidebarOpen" class="relative z-[70] h-full w-[220px] shrink-0 border-r border-[#1a1008] bg-gradient-to-b from-[#3a2a1a] to-[#2e2014] opacity-100 max-md:absolute max-md:inset-y-0 max-md:left-0 max-md:shadow-[4px_0_20px_rgba(0,0,0,0.5)]">
        <NavPanel @navigate="onNavigate" />
      </div>
      <div class="relative z-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <RouterView />
      </div>
    </div>

    <GlobalToast />
    <ReloadModal />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';
import { LoaderCircle, Menu, MessageSquare } from 'lucide-vue-next';
import NavPanel from './components/NavPanel.vue';
import GlobalToast from './components/GlobalToast.vue';
import ReloadModal from './components/ReloadModal.vue';
import TasksPanel from './components/TasksPanel.vue';
import ChatSidePanel from './components/ChatSidePanel.vue';
import { useTopPanels } from './components/topPanels.js';
import { useI18n } from './i18n/index.js';
const { t } = useI18n();
const ready = ref(false);
const sidebarOpen = ref(window.innerWidth >= 768);
const route = useRoute();
const router = useRouter();
const isAuthRoute = computed(() => route.path === '/login' || route.path === '/welcome');
const {
  activePanel,
  tasks,
  taskCount,
  hasPending,
  togglePanel,
  start,
  stop
} = useTopPanels();
let panelStarted = false;

const APP_CONTEXT_KEYS = {
  '/notebook': 'app_sidebar_notebook', '/finance': 'app_sidebar_finance', '/reader': 'app_sidebar_reader',
  '/cryptobot': 'app_sidebar_cryptobot', '/subscriber': 'app_sidebar_subscriber', '/fortune': 'app_sidebar_fortune',
  '/poker': 'app_sidebar_poker', '/banana': 'app_sidebar_banana', '/files': 'app_sidebar_files',
  '/skills': 'app_sidebar_skills', '/tasks': 'app_sidebar_tasks', '/settings': 'app_sidebar_settings'
};
const currentAppContext = computed(() => {
  const p = route.path;
  for (const [prefix, key] of Object.entries(APP_CONTEXT_KEYS)) {
    if (p.startsWith(prefix)) return t(key);
  }
  return '';
});

// 进入 /chat 时关闭侧边聊天面板
watch(() => route.path, (p) => {
  if (p.startsWith('/chat') && activePanel.value === 'chat') activePanel.value = null;
});

const onNavigate = () => {
  if (window.innerWidth < 768) sidebarOpen.value = false;
};

const onResize = () => {
  if (window.innerWidth < 768) sidebarOpen.value = false;
};

onMounted(async () => {
  await router.isReady();
  ready.value = true;
  window.addEventListener('resize', onResize);
  if (!isAuthRoute.value) {
    start();
    panelStarted = true;
  }
});

watch(isAuthRoute, (isAuth) => {
  if (isAuth && panelStarted) {
    stop();
    panelStarted = false;
    return;
  }
  if (!isAuth && !panelStarted) {
    start();
    panelStarted = true;
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', onResize);
  if (panelStarted) stop();
});
</script>
