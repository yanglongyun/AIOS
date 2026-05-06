<template>
  <div class="stage">
    <AppHeader />
    <div class="body-row">
      <AppDrawer />
      <main class="main">
        <Suspense>
          <component :is="currentComponent" v-if="currentComponent" :key="activeAppId" v-bind="currentProps" />
        </Suspense>
      </main>
    </div>
    <ConnectionGate />
    <ToastHost />
    <ReloadDialog />
  </div>
</template>

<script setup>
import { computed, ref, shallowRef, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import AppHeader from '../components/AppHeader.vue';
import AppDrawer from '../components/AppDrawer.vue';
import ConnectionGate from '../components/ConnectionGate.vue';
import ToastHost from '../components/ToastHost.vue';
import ReloadDialog from '../components/ReloadDialog.vue';
import { apps, getApp } from '../apps.js';
import { useAuthStore } from '@/stores/auth';
import { connect, disconnect } from '@/system/ws.js';

const route = useRoute();
const auth = useAuthStore();
const activeAppId = ref(null);
const currentComponent = shallowRef(null);
const currentProps = computed(() => {
  if (activeAppId.value !== 'chat') return {};
  const message = route.query.workshopPrompt ? String(route.query.workshopPrompt) : '';
  if (!message) return {};
  return {
    intentRequest: {
      requestId: `workshop-${route.query.t || Date.now()}`,
      intent: 'new_and_send',
      payload: { message }
    }
  };
});

async function loadApp(id) {
  const app = getApp(id);
  if (!app) return;
  const mod = await app.load();
  currentComponent.value = mod?.default || mod;
  activeAppId.value = id;
}

watch(
  () => route.params.id,
  (id) => {
    const next = id ? String(id) : (apps[0]?.id || null);
    if (next && next !== activeAppId.value) loadApp(next);
  },
  { immediate: true }
);

watch(
  () => auth.authenticated,
  (authenticated) => {
    if (authenticated) connect();
    else disconnect();
  }
);

onMounted(async () => {
  await auth.init();
  if (auth.authenticated) connect();
});
</script>

<style scoped>
.stage {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  width: 100vw;
  overflow: hidden;
  background: var(--color-bg);
  color: var(--color-ink);
}
.body-row {
  flex: 1;
  min-height: 0;
  display: flex;
  position: relative; /* mobile drawer absolutely 定位时的容器 */
}
.main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
