<template>
  <div v-if="!ready" class="h-[100dvh] w-screen bg-[#1a1410]"></div>

  <RouterView v-else-if="isAuthRoute" />

  <div v-else class="h-[100dvh] w-screen overflow-hidden font-['Georgia','PingFang_SC',serif]">
    <!-- 桌面 -->
    <Desktop ref="desktopRef" @contextmenu="onContextMenu" />

    <!-- 所有窗口 -->
    <AppWindow
      v-for="win in windowManager.state.windows"
      :key="win.id"
      :win="win"
    />

    <!-- 右键菜单 -->
    <ContextMenu ref="ctxMenuRef" @wallpaper="wpPickerRef?.show()" />

    <!-- 壁纸选择 -->
    <WallpaperPicker ref="wpPickerRef" @select="onWallpaperSelect" />

    <!-- 底部任务栏 -->
    <Taskbar
      :task-count="taskCount"
      :mark-read="markTasksRead"
    />

    <GlobalToast />
    <ReloadModal />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';
import Desktop from './components/desktop/Desktop.vue';
import AppWindow from './components/desktop/Window.vue';
import ContextMenu from './components/desktop/ContextMenu.vue';
import WallpaperPicker from './components/desktop/WallpaperPicker.vue';
import Taskbar from './components/desktop/Taskbar.vue';
import GlobalToast from './components/GlobalToast.vue';
import ReloadModal from './components/ReloadModal.vue';
import { windowManager } from './stores/windowManager.js';
import { useTopPanels } from './components/topPanels.js';

const ready = ref(false);
const route = useRoute();
const router = useRouter();
const isAuthRoute = computed(() => route.path === '/login' || route.path === '/welcome' || route.path === '/mobile');

const desktopRef = ref(null);
const ctxMenuRef = ref(null);
const wpPickerRef = ref(null);

const {
  taskCount,
  markTasksRead,
  start,
  stop
} = useTopPanels();

let panelStarted = false;

function onContextMenu(e) {
  ctxMenuRef.value?.show(e);
}

function onWallpaperSelect(cls) {
  desktopRef.value?.setWallpaper(cls);
}

onMounted(async () => {
  await router.isReady();
  ready.value = true;
  if (!isAuthRoute.value) {
    start();
    panelStarted = true;
  }
});

watch(isAuthRoute, (isAuth) => {
  if (isAuth && panelStarted) {
    windowManager.closeAll();
    stop();
    panelStarted = false;
    return;
  }
  if (!isAuth && !panelStarted) {
    start();
    panelStarted = true;
  }
});

onUnmounted(() => {
  if (panelStarted) stop();
});
</script>
