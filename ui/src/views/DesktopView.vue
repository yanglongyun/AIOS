<template>
  <div class="h-[100dvh] w-screen overflow-hidden font-['Georgia','PingFang_SC',serif]">
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
      :task-center-open="taskCenterOpen"
      @toggle-launcher="toggleLauncher"
      @toggle-task-center="toggleTaskCenter"
    />
    <LauncherPanel
      v-if="launcherOpen"
      ref="launcherPanelRef"
      @open="onLauncherOpen"
      @close="launcherOpen = false"
      @create-app="onCreateApp"
    />
    <TaskCenter
      v-if="taskCenterOpen"
      @close="taskCenterOpen = false"
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
import TaskCenter from '../components/desktop/TaskCenter.vue';
import GlobalToast from '../components/GlobalToast.vue';
import ReloadModal from '../components/ReloadModal.vue';
import { windowManager } from '../stores/windowManager.js';
import { connect } from '../ws.js';

const desktopRef = ref(null);
const ctxMenuRef = ref(null);
const wpPickerRef = ref(null);
const windowBarRef = ref(null);
const launcherPanelRef = ref(null);
const launcherOpen = ref(false);
const taskCenterOpen = ref(false);

function onContextMenu(e) {
  ctxMenuRef.value?.show(e);
}

function onWallpaperSelect(cls) {
  desktopRef.value?.setWallpaper(cls);
}

function toggleLauncher() {
  launcherOpen.value = !launcherOpen.value;
  if (launcherOpen.value) taskCenterOpen.value = false;
}

function toggleTaskCenter() {
  taskCenterOpen.value = !taskCenterOpen.value;
  if (taskCenterOpen.value) launcherOpen.value = false;
}

function onLauncherOpen(appId) {
  windowManager.open(appId);
  launcherOpen.value = false;
}

function onCreateApp() {
  windowManager.open('create-app');
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
