<template>
  <nav class="server-bar flex h-full w-[68px] shrink-0 flex-col items-center gap-1 overflow-y-auto border-r border-black/30 bg-[linear-gradient(180deg,#201810_0%,#181010_100%)] py-2.5 font-['Georgia','PingFang_SC',serif] shadow-[2px_0_12px_rgba(0,0,0,0.4)]">
    <!-- 核心导航 -->
    <button @click="goLastChat" :title="t('app_sidebar_chat')" class="server-icon" :class="{ active: route.path.startsWith('/chat') }">
      <MessageCircle class="icon" />
    </button>
    <button @click="go('/history')" :title="t('app_sidebar_history')" class="server-icon" :class="{ active: route.path === '/history' }">
      <Clock class="icon" />
    </button>
    <button @click="go('/tasks')" :title="t('app_sidebar_tasks')" class="server-icon" :class="{ active: route.path.startsWith('/tasks') || route.path.startsWith('/task/') }">
      <ListChecks class="icon" />
    </button>
    <button @click="go('/files')" :title="t('app_sidebar_files')" class="server-icon" :class="{ active: route.path === '/files' }">
      <FolderOpen class="icon" />
    </button>
    <button @click="go('/skills')" :title="t('app_sidebar_skills')" class="server-icon" :class="{ active: route.path === '/skills' }">
      <Sparkles class="icon" />
    </button>

    <div class="my-1 h-0.5 w-7 shrink-0 rounded-full bg-[rgba(200,160,96,0.1)]" />

    <!-- 应用 -->
    <button
      v-for="app in apps" :key="app.path"
      @click="go(app.path)"
      :title="app.name"
      class="server-icon"
      :class="{ active: route.path.startsWith(app.path) }"
    >
      <component :is="app.icon" class="icon" />
    </button>

    <div class="my-1 h-0.5 w-7 shrink-0 rounded-full bg-[rgba(200,160,96,0.1)]" />

    <!-- 工具 -->
    <button @click="go('/apps/create')" :title="t('app_sidebar_create_app')" class="server-icon util">
      <Plus class="icon" />
    </button>
    <button @click="openCommunity" :title="t('app_sidebar_base')" class="server-icon util">
      <Compass class="icon" />
    </button>
    <button @click="go('/settings')" :title="t('app_sidebar_settings')" class="server-icon util" :class="{ active: route.path === '/settings' }">
      <Settings class="icon" />
    </button>
  </nav>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from '../i18n/index.js';
import {
  MessageCircle, Clock, ListChecks, FolderOpen, Sparkles,
  NotebookPen, Wallet, Rss, TrendingUp, BookOpen,
  Spade, Eye, Smartphone,
  Plus, Compass, Settings
} from 'lucide-vue-next';

const emit = defineEmits(['navigate']);
const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const apps = [
  { path: '/notebook', icon: NotebookPen, name: t('app_sidebar_notebook') },
  { path: '/finance', icon: Wallet, name: t('app_sidebar_finance') },
  { path: '/subscriber', icon: Rss, name: t('app_sidebar_subscriber') },
  { path: '/cryptobot', icon: TrendingUp, name: t('app_sidebar_cryptobot') },
  { path: '/reader', icon: BookOpen, name: t('app_sidebar_reader') },
  { path: '/poker', icon: Spade, name: t('app_sidebar_poker') },
  { path: '/fortune', icon: Eye, name: t('app_sidebar_fortune') },
  { path: '/banana', icon: Smartphone, name: t('app_sidebar_banana') },
];

const go = (path) => {
  emit('navigate');
  router.push(path);
};

const goLastChat = () => {
  emit('navigate');
  const lastId = localStorage.getItem('lastConversationId');
  router.push(lastId ? `/chat/${lastId}` : '/chat');
};

const openCommunity = () => {
  emit('navigate');
  const url = localStorage.getItem('communityUrl') || 'https://aios.chatnext.ai';
  window.open(url, '_blank', 'noopener,noreferrer');
};
</script>

<style scoped>
.icon {
  width: 20px;
  height: 20px;
}

.server-icon {
  width: 44px;
  height: 44px;
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  color: #b8a080;
  background: #2e2014;
  flex-shrink: 0;
  border: 1px solid transparent;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.server-icon:hover {
  border-radius: 14px;
  border-color: rgba(200, 160, 96, 0.2);
  color: #e8d4b8;
}

.server-icon.active {
  border-radius: 14px;
  background: linear-gradient(180deg, #c09048, #9a6c28);
  color: #1a1410;
  border-color: rgba(200, 160, 96, 0.3);
  box-shadow: 0 3px 0 rgba(100, 60, 10, 0.4), inset 0 1px 0 rgba(255, 240, 200, 0.2);
}

/* pill indicator */
.server-icon::before {
  content: '';
  position: absolute;
  left: -14px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 0;
  border-radius: 0 3px 3px 0;
  background: #c8a060;
  transition: height 0.2s;
}

.server-icon:hover::before {
  height: 18px;
}

.server-icon.active::before {
  height: 32px;
}

/* util icons */
.server-icon.util {
  background: transparent;
  box-shadow: none;
  color: #8a7050;
}

.server-icon.util:hover {
  background: rgba(200, 160, 96, 0.08);
  color: #b8a080;
  box-shadow: none;
}

.server-icon.util.active {
  background: linear-gradient(180deg, #c09048, #9a6c28);
  color: #1a1410;
  box-shadow: 0 3px 0 rgba(100, 60, 10, 0.4), inset 0 1px 0 rgba(255, 240, 200, 0.2);
}

nav {
  scrollbar-width: none;
}
nav::-webkit-scrollbar {
  display: none;
}
</style>
