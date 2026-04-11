<template>
  <div class="flex h-dvh flex-col overflow-hidden font-['Georgia','PingFang_SC',serif] transition-[background] duration-500" :class="wallpaperClass" @click="menuOpen = false">
    <TopBar
      v-if="openedApp"
      :app="openedApp"
      :nav="navOverride"
      :username="username"
      @close="closeApp"
      @toggle-menu="onToggleMenu"
    />

    <div class="relative min-h-0 flex-1 overflow-hidden">
      <div
        v-if="openedApp"
        class="absolute inset-0 flex flex-col overflow-hidden"
        :class="openedApp.shellClass || 'bg-white'"
      >
        <component :is="openedApp.component" v-bind="openedApp.props" />
      </div>
      <AppGrid v-else @open="openApp" />
    </div>

    <UserMenu
      :visible="menuOpen"
      :username="username"
      :style="menuStyle"
      @close="menuOpen = false"
      @restart="doRestart"
      @logout="doLogout"
    />

    <ReloadModal />
  </div>
</template>

<script setup>
import { computed, onMounted, provide, reactive, ref, shallowRef } from 'vue';
import { useRouter } from 'vue-router';
import TopBar from '../components/mobile/TopBar.vue';
import AppGrid from '../components/mobile/AppGrid.vue';
import UserMenu from '../components/mobile/UserMenu.vue';
import ReloadModal from '../components/ReloadModal.vue';
import { getApp } from '../apps.js';
import { currentWallpaper } from '../stores/appearance.js';
import { clearAuthCache } from '../auth/session.js';
import { connect } from '../system/ws.js';

const router = useRouter();

const wallpaperClass = computed(() =>
  currentWallpaper.value?.type === 'css' ? currentWallpaper.value.id : ''
);

const navOverride = reactive({ title: null, back: null });
function setMobileNav(title, back) {
  navOverride.title = title;
  navOverride.back = back;
}
provide('mobileNav', setMobileNav);

// 用户
const username = ref('');
const menuOpen = ref(false);
const menuStyle = ref({});

async function fetchMe() {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    const data = await res.json();
    username.value = data?.user?.username || '';
  } catch {}
}

function onToggleMenu(btnEl) {
  if (!menuOpen.value && btnEl) {
    const rect = btnEl.getBoundingClientRect();
    menuStyle.value = {
      top: (rect.bottom + 6) + 'px',
      right: (window.innerWidth - rect.right) + 'px',
    };
  }
  menuOpen.value = !menuOpen.value;
}

async function doLogout() {
  menuOpen.value = false;
  if (!window.confirm('__T_LOGOUT_CONFIRM__')) return;
  try {
    await fetch('/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
  } catch {}
  clearAuthCache();
  router.push('/login');
}

async function doRestart() {
  menuOpen.value = false;
  try {
    await fetch('/api/system/reload/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ build: false, restartApps: true, restartServer: false })
    });
  } catch {}
}

// 应用
const openedApp = shallowRef(null);
async function openApp(appId) {
  const app = getApp(appId);
  if (!app) return;
  navOverride.title = null;
  navOverride.back = null;
  const loader = app.mobileLoad || app.desktopLoad;
  if (!loader) return;
  const mod = await loader();
  openedApp.value = {
    appId,
    component: mod.default,
    props: {},
    shellClass: app.mobileShellClass || ''
  };
}
function closeApp() {
  openedApp.value = null;
  navOverride.title = null;
  navOverride.back = null;
}

onMounted(() => {
  connect();
  fetchMe();
});
</script>

