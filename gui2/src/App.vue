<script setup>
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import TopBar from './components/TopBar.vue';
import AppsPopup from './components/AppsPopup.vue';
import QuickChat from './components/QuickChat.vue';
import Login from './components/Login.vue';
import { useViewStore } from './stores/view.js';
import { useAuthStore } from './stores/auth.js';
import { getApp } from './apps.js';
import { connect, disconnect } from './lib/ws.js';

const view = useViewStore();
const auth = useAuthStore();
const route = useRoute();
const currentApp = computed(() => getApp(route.path.replace('/app/', '')));
const showBackdrop = computed(() => currentApp.value?.hasDrawer && view.appDrawerOpen);

// 鉴权通过时连 WS,断开时关掉
watch(() => auth.authenticated, (ok) => {
  if (ok) connect();
  else disconnect();
}, { immediate: true });
</script>

<template>
  <Login v-if="auth.phase !== 'pending' && !auth.authenticated" />
  <template v-else>
    <TopBar />
    <main class="main">
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </main>

    <Teleport to="body">
      <div v-if="showBackdrop" class="app-side-backdrop" @click="view.closeAppDrawer()"></div>
    </Teleport>

    <AppsPopup />
    <QuickChat />
  </template>
</template>

<style scoped>
.main {
  flex: 1; min-width: 0; min-height: 0;
  display: flex;
  background: var(--bg);
  overflow: hidden;
}
</style>
