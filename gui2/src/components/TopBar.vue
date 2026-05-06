<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useViewStore } from '@/stores/view.js';
import { getApp } from '@/apps.js';

const view = useViewStore();
const route = useRoute();
const currentApp = computed(() => {
  const id = route.path.replace('/app/', '');
  return getApp(id);
});
const showHamburger = computed(() => !!currentApp.value?.hasDrawer);
// 套娃避免:chat app 内部不再放 💬,只保留 ⚏ 切应用
const showChatBtn = computed(() => currentApp.value?.id !== 'chat');
</script>

<template>
  <header class="topbar">
    <button v-if="showHamburger"
      class="icon-btn lg"
      :class="{ active: view.appDrawerOpen }"
      @click="view.toggleAppDrawer()" title="侧栏">
      <span class="msi">menu</span>
    </button>
    <span v-else class="left-spacer"></span>

    <div class="brand" v-if="currentApp">
      <span class="name">{{ currentApp.name }}</span>
    </div>

    <div class="right">
      <button v-if="showChatBtn"
        class="icon-btn lg"
        :class="{ active: view.chatOpen }"
        @click="view.toggleChat()" title="问 AI">
        <span class="msi">chat_bubble_outline</span>
      </button>
      <button class="icon-btn lg"
        :class="{ active: view.appsOpen }"
        @click="view.toggleApps()" title="所有应用">
        <span class="msi">apps</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  flex: none;
  height: var(--topbar-h);
  display: flex; align-items: center;
  padding: 8px 16px;
  background: var(--bg);
  border-bottom: 1px solid transparent;
  position: relative; z-index: 10;
}
.left-spacer { width: 8px; }
.brand {
  display: inline-flex; align-items: center;
  margin: 0 4px 0 12px;
  color: var(--text);
}
.brand .name {
  font-size: 20px; font-weight: 500;
  color: var(--text);
  letter-spacing: -0.01em;
}

.right { display: flex; align-items: center; gap: 4px; margin-left: auto; }

@media (max-width: 720px) {
  .topbar { padding: 8px; height: 56px; }
  .brand .name { font-size: 17px; }
}
</style>
