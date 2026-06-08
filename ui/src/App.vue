<template>
  <div class="flex h-dvh w-screen flex-col overflow-hidden bg-bg">
    <TopBar
      :app="activeTab === 'apps' ? openedApp : null"
      :nav="navForTopBar"
      :tab-title="tabTitleMap[activeTab] || ''"
      @close="closeApp"
    />

    <div class="relative min-h-0 flex-1 overflow-hidden">
      <!-- 对话 -->
      <div v-show="activeTab === 'chat'" class="absolute inset-0">
        <ChatPanelView />
      </div>
      <!-- 应用 -->
      <div v-show="activeTab === 'apps'" class="absolute inset-0">
        <div v-if="openedApp" class="absolute inset-0 flex flex-col overflow-hidden bg-bg">
          <Suspense>
            <component :is="openedApp.component" v-bind="openedApp.props" />
          </Suspense>
        </div>
        <AppsView v-else @open="openApp" />
      </div>
      <!-- 任务 -->
      <div v-show="activeTab === 'tasks'" class="absolute inset-0">
        <TasksView />
      </div>
    </div>

    <TabBar :model-value="activeTab" @update:model-value="onTabChange" />
  </div>
</template>

<script setup>
import { ref, shallowRef, reactive, computed, watch, provide, onMounted, onUnmounted } from 'vue';
import TopBar from './system/components/TopBar.vue';
import TabBar from './system/components/TabBar.vue';
import ChatPanelView from './apps/chat/views/index.vue';
import AppsView      from './system/views/apps/AppsView.vue';
import TasksView     from './system/views/tasks/index.vue';
import { getApp } from './apps.js';
import { t } from './system/locale.js';

// ─── 二级页面顶栏注入 (provide('pageNav')) ───
// 子页面调用 setPageNav(title, back, leftAction, rightAction) 来定制顶栏.
const chatNav  = reactive({ title: null, back: null, leftAction: null, rightAction: null });
const tasksNav = reactive({ title: null, back: null, leftAction: null, rightAction: null });

function setPageNav(title, back, leftAction = null, rightAction = null) {
  if (activeTab.value === 'chat')  Object.assign(chatNav,  { title, back, leftAction, rightAction });
  if (activeTab.value === 'tasks') Object.assign(tasksNav, { title, back, leftAction, rightAction });
}
provide('pageNav', setPageNav);

const navForTopBar = computed(() => {
  if (activeTab.value === 'chat')  return chatNav;
  if (activeTab.value === 'tasks') return tasksNav;
  return { title: null, back: null };
});

// ─── Tab 状态 ───
const activeTab = ref('chat');
const tabTitleMap = { apps: t('app_tab_apps', '应用'), tasks: t('app_tab_tasks', '任务') };
function onTabChange(tab) { activeTab.value = tab; }

function onOpenChatEvent() {
  activeTab.value = 'chat';
}
onMounted(() => window.addEventListener('aios:open-chat', onOpenChatEvent));
onUnmounted(() => window.removeEventListener('aios:open-chat', onOpenChatEvent));

// Apps tab: open and close app screens.
const openedApp = shallowRef(null);
async function openApp(appId, props = {}) {
  const app = getApp(appId);
  if (!app) return;
  const mod = await app.load();
  openedApp.value = { appId, component: mod.default || mod, props };
}
function closeApp() { openedApp.value = null; }
</script>
