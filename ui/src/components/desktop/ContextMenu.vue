<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-[500]" @click="close" @contextmenu.prevent="close">
      <div
        class="absolute min-w-[180px] rounded-xl border p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.06)] backdrop-blur-2xl"
        :class="menuClass"
        :style="{ left: x + 'px', top: y + 'px' }"
        @click.stop
      >
        <div class="flex cursor-pointer items-center gap-2 rounded-[8px] px-3 py-2 text-[13px] font-medium transition-all duration-100" :class="itemClass" @click="action('chat')">
          <span class="text-sm">💬</span>__T_CONTEXT_NEW_CHAT__
        </div>
        <div class="flex cursor-pointer items-center gap-2 rounded-[8px] px-3 py-2 text-[13px] font-medium transition-all duration-100" :class="itemClass" @click="action('createapp')">
          <span class="text-sm">➕</span>__T_CONTEXT_NEW_APP__
        </div>
        <div class="mx-2 my-1 h-px" :class="dividerClass" />
        <div class="flex cursor-pointer items-center gap-2 rounded-[8px] px-3 py-2 text-[13px] font-medium transition-all duration-100" :class="itemClass" @click="refresh">
          <span class="text-sm">🔄</span>__T_CONTEXT_REFRESH__
        </div>
        <div class="mx-2 my-1 h-px" :class="dividerClass" />
        <div class="flex cursor-pointer items-center gap-2 rounded-[8px] px-3 py-2 text-[13px] font-medium transition-all duration-100" :class="itemClass" @click="$emit('wallpaper'); close()">
          <span class="text-sm">🖼️</span>__T_CONTEXT_CHANGE_WALLPAPER__
        </div>
        <div class="flex cursor-pointer items-center gap-2 rounded-[8px] px-3 py-2 text-[13px] font-medium transition-all duration-100" :class="itemClass" @click="action('settings')">
          <span class="text-sm">⚙️</span>__T_CONTEXT_SETTINGS__
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref } from 'vue';
import { openIntent } from '../../system/intent.js';
import { desktopTheme } from '../../stores/appearance.js';

defineEmits(['wallpaper']);

const visible = ref(false);
const x = ref(0);
const y = ref(0);
const isDarkTheme = computed(() => desktopTheme.value === 'dark');
const menuClass = computed(() => isDarkTheme.value
  ? 'border-white/[0.08] bg-[#141a2b]/[0.84]'
  : 'border-white/[0.5] bg-white/[0.78]');
const itemClass = computed(() => isDarkTheme.value
  ? 'text-white hover:bg-white/[0.08]'
  : 'text-[#222] hover:bg-black/[0.05]');
const dividerClass = computed(() => isDarkTheme.value ? 'bg-white/[0.08]' : 'bg-black/[0.06]');

function show(e) {
  x.value = Math.min(e.clientX, window.innerWidth - 200);
  y.value = Math.min(e.clientY, window.innerHeight - 260);
  visible.value = true;
}

function close() {
  visible.value = false;
}

async function action(appId) {
  close();
  if (appId === 'chat') {
    await openIntent({ app: 'chat', action: 'open_new' });
    return;
  }
  if (appId === 'createapp') {
    await openIntent({ app: 'createapp', action: 'open' });
    return;
  }
  if (appId === 'settings') {
    await openIntent({ app: 'settings', action: 'open' });
    return;
  }
}

function refresh() {
  close();
  location.reload();
}

defineExpose({ show });
</script>
