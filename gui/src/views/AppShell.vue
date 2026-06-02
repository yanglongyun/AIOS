<template>
  <div id="aios-container">
    <!-- LEFT SWITCHER (DESKTOP ONLY SIDEBAR) -->
    <nav class="switcher">
      <div class="switcher-top">
        <div class="os-logo">AIOS</div>
        <div class="switcher-apps-container">
          <button v-for="app in apps" :key="app.id"
            class="switcher-btn"
            :class="{ active: activeAppId === app.id }"
            @click="go(app.id)"
            :title="app.name">
            <span class="material-symbols-outlined">{{ app.icon }}</span>
            <span class="btn-label">{{ app.name }}</span>
          </button>
        </div>
      </div>
      <div class="switcher-bottom">
        <div class="system-status">
          <div class="status-dot"></div>
        </div>
      </div>
    </nav>

    <!-- RIGHT WORKSPACE AREA -->
    <main class="workspace">
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
import { useRoute, useRouter } from 'vue-router';
import AppsPopup from '../components/AppsPopup.vue';
import QuickChat from '../components/QuickChat.vue';
import ConnectionGate from '../components/ConnectionGate.vue';
import ToastHost from '../components/ToastHost.vue';
import ReloadDialog from '../components/ReloadDialog.vue';
import { apps, getApp } from '../apps.js';
import { useAuthStore } from '@/stores/auth';
import { connect, disconnect } from '@/system/ws.js';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const activeAppId = ref(null);
const currentComponent = shallowRef(null);

async function loadApp(id) {
  const app = getApp(id);
  if (!app) {
    router.replace('/app/chat');
    return;
  }
  const mod = await app.load();
  currentComponent.value = mod?.default || mod;
  activeAppId.value = id;
}

function go(id) {
  const path = `/app/${id}`;
  if (route.path !== path) router.push(path);
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
#aios-container {
  display: grid;
  grid-template-columns: 76px 1fr;
  height: 100dvh;
  width: 100vw;
  overflow: hidden;
  background: var(--bg-elev);
}

.workspace {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  overflow: hidden;
}

/* Left Switcher (Desktop) */
.switcher {
  background-color: var(--bg-elev);
  border-right: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0;
  justify-content: space-between;
  user-select: none;
  height: 100dvh;
  overflow: hidden;
}

.switcher-top {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: calc(100% - 60px);
}

.os-logo {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--accent);
  border-radius: 4px;
  color: var(--accent);
  font-family: var(--font-mono), monospace;
  font-weight: 800;
  font-size: 13px;
  letter-spacing: -1px;
  margin-bottom: 20px;
  box-shadow: 0 0 8px rgba(0, 229, 255, 0.2);
  flex-shrink: 0;
}

.switcher-apps-container {
  flex: 1;
  width: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
}

/* Hide scrollbar */
.switcher-apps-container::-webkit-scrollbar {
  display: none;
}
.switcher-apps-container {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.switcher-btn {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-2);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  flex-shrink: 0;
}

.switcher-btn span.material-symbols-outlined {
  font-size: 20px;
}

.switcher-btn span.btn-label {
  font-size: 9px;
  font-weight: 500;
  white-space: nowrap;
}

.switcher-btn:hover {
  color: var(--text);
  background-color: var(--bg-card);
}

.switcher-btn.active {
  color: var(--accent);
  background-color: var(--bg-hover);
  border-color: rgba(0, 229, 255, 0.3);
  box-shadow: 0 0 10px rgba(0, 229, 255, 0.1);
}

.switcher-btn.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 12px;
  bottom: 12px;
  width: 3px;
  background-color: var(--accent);
  border-radius: 0 2px 2px 0;
}

.switcher-bottom {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.system-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--good);
  box-shadow: 0 0 6px var(--good);
  animation: heartbeat 2s infinite;
}

@keyframes heartbeat {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; box-shadow: 0 0 8px var(--good); }
}

@media (max-width: 768px) {
  #aios-container {
    grid-template-columns: 1fr;
  }
  .switcher {
    display: none;
  }
}
</style>
