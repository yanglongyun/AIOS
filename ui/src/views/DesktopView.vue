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
    <Taskbar />
    <GlobalToast />
    <ReloadModal />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Desktop from '../components/desktop/Desktop.vue';
import AppWindow from '../components/desktop/Window.vue';
import ContextMenu from '../components/desktop/ContextMenu.vue';
import WallpaperPicker from '../components/desktop/WallpaperPicker.vue';
import Taskbar from '../components/desktop/Taskbar.vue';
import GlobalToast from '../components/GlobalToast.vue';
import ReloadModal from '../components/ReloadModal.vue';
import { windowManager } from '../stores/windowManager.js';
import { connect } from '../ws.js';

const desktopRef = ref(null);
const ctxMenuRef = ref(null);
const wpPickerRef = ref(null);

function onContextMenu(e) {
  ctxMenuRef.value?.show(e);
}

function onWallpaperSelect(cls) {
  desktopRef.value?.setWallpaper(cls);
}

onMounted(() => { connect(); });
</script>
