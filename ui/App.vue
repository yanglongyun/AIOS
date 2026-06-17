<script setup>
import { PanelLeft, Plus, Settings } from '@lucide/vue';
import { onMounted, onUnmounted, provide, reactive, ref } from 'vue';
import AppsView from './components/Apps.vue';
import Sidebar from './components/Sidebar.vue';
import ChatView from './views/Chat.vue';
import ControlsView from './views/Controls.vue';
import MemoriesView from './views/Memories.vue';
import SettingsView from './views/Settings.vue';
import SkillsView from './views/Skills.vue';
import TasksView from './views/Tasks.vue';
import { t } from './lib/locale.js';

const nav = reactive({
  title: '',
  back: null,
  left: null,
  right: null,
});
const activeView = ref('chat');
const activeAppId = ref('');
const sidebarOpen = ref(true);
const isMobile = ref(false);
let viewportInitialized = false;

provide('pageNav', (title, back, left, right) => {
  nav.title = title || '';
  nav.back = back || null;
  nav.left = left || null;
  nav.right = right || null;
});

function requestNewChat() {
  activeView.value = 'chat';
  activeAppId.value = '';
  window.dispatchEvent(new CustomEvent('agent:new-chat'));
  closeSidebarOnMobile();
}

function requestOpenChat(chat) {
  activeView.value = 'chat';
  activeAppId.value = '';
  window.dispatchEvent(new CustomEvent('agent:open-chat', { detail: { chat } }));
  closeSidebarOnMobile();
}

function requestOpenApp(appId) {
  activeAppId.value = appId;
  activeView.value = 'app';
  closeSidebarOnMobile();
}

function requestTasks() {
  activeView.value = 'tasks';
  activeAppId.value = '';
  closeSidebarOnMobile();
}

function requestMemories() {
  activeView.value = 'memories';
  activeAppId.value = '';
  closeSidebarOnMobile();
}

function requestSkills() {
  activeView.value = 'skills';
  activeAppId.value = '';
  closeSidebarOnMobile();
}

function requestControls() {
  activeView.value = 'controls';
  activeAppId.value = '';
  closeSidebarOnMobile();
}

function requestSettings() {
  activeView.value = 'settings';
  activeAppId.value = '';
  closeSidebarOnMobile();
}

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value;
}

function closeSidebarOnMobile() {
  if (isMobile.value) sidebarOpen.value = false;
}

function syncViewport() {
  const nextMobile = window.matchMedia('(max-width: 760px)').matches;
  if (!viewportInitialized || nextMobile !== isMobile.value) {
    isMobile.value = nextMobile;
    sidebarOpen.value = !nextMobile;
    viewportInitialized = true;
  }
}

const iconMap = { add: Plus, settings: Settings };

onMounted(() => {
  syncViewport();
  window.addEventListener('resize', syncViewport);
});

onUnmounted(() => {
  window.removeEventListener('resize', syncViewport);
});
</script>

<template>
  <div class="relative flex h-full overflow-hidden" :class="{ 'sidebar-open': sidebarOpen }">
    <button v-if="isMobile && sidebarOpen" class="fixed inset-0 z-35 bg-[rgba(31,29,32,0.28)]" type="button" aria-label="Close sidebar" @click="sidebarOpen = false"></button>
    <Sidebar
      :open="sidebarOpen"
      :is-mobile="isMobile"
      @new-chat="requestNewChat"
      @open-chat="requestOpenChat"
      @open-app="requestOpenApp"
      @tasks="requestTasks"
      @memories="requestMemories"
      @skills="requestSkills"
      @controls="requestControls"
      @settings="requestSettings"
    />

    <main class="flex min-w-0 min-h-0 flex-1 flex-col bg-[var(--bg)]">
      <header class="flex h-[52px] shrink-0 items-center gap-2 border-b border-[var(--line)] bg-white px-3">
        <button class="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[var(--muted)] transition-colors hover:bg-black/5 hover:text-[var(--ink)]" type="button" aria-label="Toggle sidebar" :aria-expanded="sidebarOpen" @click="toggleSidebar">
          <PanelLeft class="h-[18px] w-[18px] stroke-2" />
        </button>
        <button v-if="nav.back" class="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xl leading-none text-[var(--muted)] transition-colors hover:bg-black/5 hover:text-[var(--ink)]" type="button" aria-label="Back" @click="nav.back">
          &lt;
        </button>
        <b class="min-w-0 truncate text-[14px] font-semibold">{{ nav.title || t('chat_title', 'Agent Chat') }}</b>
        <span class="flex-1"></span>
        <button v-if="nav.right" class="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[var(--muted)] transition-colors hover:bg-black/5 hover:text-[var(--ink)]" type="button" :title="nav.right.title" @click="nav.right.fn">
          <component :is="iconMap[nav.right.icon] || Settings" class="h-[18px] w-[18px] stroke-2" />
        </button>
      </header>

      <div class="relative min-h-0 flex-1 overflow-hidden">
        <ChatView v-if="activeView === 'chat'" />
        <AppsView v-else-if="activeView === 'app'" :app-id="activeAppId" @open-app="requestOpenApp" />
        <TasksView v-else-if="activeView === 'tasks'" />
        <MemoriesView v-else-if="activeView === 'memories'" />
        <SkillsView v-else-if="activeView === 'skills'" />
        <ControlsView v-else-if="activeView === 'controls'" />
        <SettingsView v-else />
      </div>
    </main>
  </div>
</template>
