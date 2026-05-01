<template>
  <div class="stage">
    <AppTopbar />
    <div class="body">
      <AppDrawer />
      <main class="main">
        <Suspense>
          <component :is="currentComponent" v-if="currentComponent" :key="activeAppId" />
        </Suspense>
      </main>
    </div>
    <ConnectionGate />
    <ToastHost />
    <ReloadDialog />
  </div>
</template>

<script setup>
import { ref, shallowRef, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import AppTopbar from '../components/AppTopbar.vue';
import AppDrawer from '../components/AppDrawer.vue';
import ConnectionGate from '../components/ConnectionGate.vue';
import ToastHost from '../components/ToastHost.vue';
import ReloadDialog from '../components/ReloadDialog.vue';
import { apps, getApp } from '../apps.js';
import { useWsStore } from '@/stores/ws';

const route = useRoute();
const ws = useWsStore();
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

onMounted(() => {
  ws.init();
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
.body {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-areas: "rail main";
  grid-template-columns: auto 1fr;
}
.main {
  grid-area: main;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* ===== Mobile: topbar is fixed; reserve top space for main ===== */
@media (max-width: 768px) {
  .stage {
    /* topbar is position:fixed on mobile, so push body down */
    padding-top: calc(52px + env(safe-area-inset-top));
  }
  .body {
    /* rail is position:fixed and slides over main; main fills viewport */
    grid-template-columns: 0 1fr;
  }
}
</style>
