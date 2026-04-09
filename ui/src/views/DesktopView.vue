<template>
  <div class="h-[100dvh] w-screen overflow-hidden font-['Barlow',system-ui,sans-serif]">
    <Desktop ref="desktopRef" @contextmenu="onContextMenu" />

    <AppWindow
      v-for="win in windowManager.state.windows"
      :key="win.id"
      :win="win"
    />

    <ContextMenu ref="ctxMenuRef" @wallpaper="wpPickerRef?.show()" />
    <WallpaperPicker ref="wpPickerRef" @select="onWallpaperSelect" />
    <WindowBar
      ref="windowBarRef"
      :launcher-open="launcherOpen"
      @toggle-launcher="toggleLauncher"
    />
    <LauncherPanel
      v-if="launcherOpen"
      ref="launcherPanelRef"
      @open="onLauncherOpen"
      @close="launcherOpen = false"
      @create-app="onCreateApp"
    />
    <GlobalToast />
    <ReloadModal />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import Desktop from '../components/desktop/Desktop.vue';
import AppWindow from '../components/desktop/Window.vue';
import ContextMenu from '../components/desktop/ContextMenu.vue';
import WallpaperPicker from '../components/desktop/WallpaperPicker.vue';
import WindowBar from '../components/desktop/WindowBar.vue';
import LauncherPanel from '../components/desktop/LauncherPanel.vue';
import GlobalToast from '../components/GlobalToast.vue';
import ReloadModal from '../components/ReloadModal.vue';
import { getApp } from '../apps.js';
import { windowManager } from '../system/windows.js';
import { connect } from '../system/ws.js';

const desktopRef = ref(null);
const ctxMenuRef = ref(null);
const wpPickerRef = ref(null);
const windowBarRef = ref(null);
const launcherPanelRef = ref(null);
const launcherOpen = ref(false);

function onContextMenu(e) {
  ctxMenuRef.value?.show(e);
}

function onWallpaperSelect(cls) {
  desktopRef.value?.setWallpaper(cls);
}

function toggleLauncher() {
  launcherOpen.value = !launcherOpen.value;
}

function onLauncherOpen(appId) {
  const app = getApp(appId);
  if (app) {
    windowManager.openWindow(app);
  }
  launcherOpen.value = false;
}

function onCreateApp() {
  const app = getApp('createapp');
  if (app) {
    windowManager.openWindow(app);
  }
  launcherOpen.value = false;
}

const handleDocumentPointerDown = (event) => {
  const target = event.target;
  const launcherButton = windowBarRef.value?.launcherButtonEl;
  if (launcherOpen.value && !launcherPanelRef.value?.$el?.contains(target) && !launcherButton?.contains(target)) {
    launcherOpen.value = false;
  }
};

onMounted(() => {
  connect();
  document.addEventListener('pointerdown', handleDocumentPointerDown);
});

onUnmounted(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown);
});
</script>
