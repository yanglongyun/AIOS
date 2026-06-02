<template>
  <div class="stage">
    <main class="main">
      <Suspense>
        <component :is="currentComponent" v-if="currentComponent" :key="activeAppId" />
      </Suspense>
    </main>

    <AppsPopup />
    <QuickChat />
    <ConnectionGate />
    <ToastHost />
    <ReloadDialog />
  </div>
</template>

<script setup>
import { ref, shallowRef, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import AppsPopup from '../components/AppsPopup.vue';
import QuickChat from '../components/QuickChat.vue';
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
  background:
    linear-gradient(rgba(0, 215, 255, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 215, 255, 0.03) 1px, transparent 1px),
    radial-gradient(circle at 18% 0%, rgba(0, 215, 255, 0.16), transparent 34%),
    radial-gradient(circle at 100% 100%, rgba(12, 80, 170, 0.18), transparent 40%),
    var(--bg);
  background-size: 48px 48px, 48px 48px, auto, auto, auto;
  color: var(--text);
}
.main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  background: rgba(2, 7, 20, 0.72);
  overflow: hidden;
}
</style>
