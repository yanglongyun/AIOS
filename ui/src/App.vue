<template>
  <div v-if="!ready" class="h-[100dvh] w-screen bg-[#1a1410]"></div>

  <RouterView v-else-if="isAuthRoute" />

  <div v-else class="flex h-[100dvh] w-screen flex-col overflow-hidden bg-[#1a1410] font-['Georgia','PingFang_SC',serif]">

    <!-- 顶栏 -->
    <div class="relative z-[300] flex h-12 shrink-0 items-center border-b border-black/30 bg-[linear-gradient(180deg,#201810_0%,#181010_100%)] px-4 shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
      <!-- 左：hamburger (mobile) -->
      <div class="flex w-[68px] shrink-0 items-center justify-center max-md:w-auto">
        <button @click="serverBarOpen = !serverBarOpen" class="hidden h-8 w-8 cursor-pointer items-center justify-center rounded-md text-lg text-[#8a7050] transition-all hover:bg-[rgba(200,160,96,0.08)] hover:text-[#b8a080] max-md:flex">☰</button>
      </div>
      <!-- 中：页面名称 -->
      <div class="flex-1 text-center text-[13px] font-bold tracking-wide text-[#c8a060]">{{ currentPageName }}</div>
      <!-- 右：任务 + 对话 -->
      <div class="flex items-center gap-2">
        <button :title="t('app_top_tasks')" @click="togglePanel('tasks')" class="relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-white/10 bg-white/10 text-[#d4c0a0] transition-all hover:bg-white/15 hover:text-[#f0e0c0]">
          <LoaderCircle class="h-[14px] w-[14px]" :class="{ 'animate-spin': hasPending }" />
          <span v-if="taskCount > 0" class="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#c8a060] px-0.5 text-[9px] font-bold text-[#2a1a0a]">{{ taskCount > 99 ? '99+' : taskCount }}</span>
        </button>
        <button v-if="!isChatRoute" :title="t('app_top_chat')" @click="togglePanel('chat')" class="relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-white/10 bg-white/10 text-[#d4c0a0] transition-all hover:bg-white/15 hover:text-[#f0e0c0]" :class="activePanel === 'chat' ? 'bg-white/20 text-[#f0e0c0]' : ''">
          <MessageSquare class="h-[14px] w-[14px]" />
        </button>
      </div>
    </div>

    <TasksPanel
      v-if="activePanel === 'tasks'"
      :tasks="tasks"
      @close="activePanel = null"
    />

    <ChatPanel
      v-if="activePanel === 'chat'"
      :pending-message="chatPanel.state.pendingMessage"
      @close="activePanel = null"
    />

    <!-- 下方：服务栏 + 内容区 -->
    <div class="relative flex min-h-0 flex-1">
      <!-- 移动端：服务栏遮罩 -->
      <div v-if="serverBarOpen" @click="serverBarOpen = false" class="fixed inset-0 z-[150] hidden bg-[rgba(10,8,5,0.6)] max-md:block" />

      <!-- 服务栏：桌面静态 / 移动端 fixed 滑出 -->
      <div class="max-md:fixed max-md:left-0 max-md:top-12 max-md:bottom-0 max-md:z-[200] max-md:transition-transform max-md:duration-250" :class="serverBarOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full'">
        <ServerBar @navigate="onServerNavigate" />
      </div>

      <!-- 内容区（圆角卡片） -->
      <div class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-tl-[10px] bg-[#2a2218] max-md:rounded-tl-none">
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
import { LoaderCircle, MessageSquare } from 'lucide-vue-next';
import ServerBar from './components/ServerBar.vue';
import GlobalToast from './components/GlobalToast.vue';
import ReloadModal from './components/ReloadModal.vue';
import TasksPanel from './components/TasksPanel.vue';
import ChatPanel from './components/ChatPanel.vue';
import { useTopPanels } from './components/topPanels.js';
import { chatPanel } from './stores/chatPanel.js';
import { useI18n } from './i18n/index.js';
const { t } = useI18n();
const ready = ref(false);
const serverBarOpen = ref(false);
const route = useRoute();
const router = useRouter();
const isAuthRoute = computed(() => route.path === '/login' || route.path === '/welcome');
const isChatRoute = computed(() => route.path.startsWith('/chat'));

const currentPageName = computed(() => {
  const p = route.path;
  if (p.startsWith('/chat')) return t('app_sidebar_chat');
  if (p === '/history') return t('app_sidebar_history');
  if (p.startsWith('/tasks') || p.startsWith('/task/')) return t('app_sidebar_tasks');
  if (p === '/files') return t('app_sidebar_files');
  if (p === '/skills') return t('app_sidebar_skills');
  if (p.startsWith('/notebook')) return t('app_sidebar_notebook');
  if (p.startsWith('/finance')) return t('app_sidebar_finance');
  if (p.startsWith('/subscriber')) return t('app_sidebar_subscriber');
  if (p.startsWith('/cryptobot')) return t('app_sidebar_cryptobot');
  if (p.startsWith('/reader')) return t('app_sidebar_reader');
  if (p.startsWith('/poker')) return t('app_sidebar_poker');
  if (p.startsWith('/fortune')) return t('app_sidebar_fortune');
  if (p.startsWith('/banana')) return t('app_sidebar_banana');
  if (p === '/settings') return t('app_sidebar_settings');
  if (p === '/apps/create') return t('app_sidebar_create_app');
  return 'AIOS';
});

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

watch(() => route.path, (p) => {
  if (p.startsWith('/chat') && activePanel.value === 'chat') activePanel.value = null;
});

watch(activePanel, (v) => { document.body.style.overflow = v ? 'hidden' : ''; });

watch(() => chatPanel.state.requestOpen, () => {
  if (chatPanel.state.requestOpen > 0) activePanel.value = 'chat';
});

const onServerNavigate = () => {
  serverBarOpen.value = false;
};

const onResize = () => {
  if (window.innerWidth < 768) serverBarOpen.value = false;
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
