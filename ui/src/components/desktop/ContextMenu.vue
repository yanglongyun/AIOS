<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-[500]" @click="close" @contextmenu.prevent="close">
      <div
        class="ctx-menu absolute min-w-[180px] rounded-xl p-1.5"
        :style="{ left: x + 'px', top: y + 'px' }"
        @click.stop
      >
        <div class="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-[#2c2420] transition-all duration-100 hover:bg-[rgba(224,136,80,0.12)] hover:text-[#e08850]" @click="action('chat')">
          <span class="text-sm">💬</span>新建对话
        </div>
        <div class="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-[#2c2420] transition-all duration-100 hover:bg-[rgba(224,136,80,0.12)] hover:text-[#e08850]" @click="action('task-create')">
          <span class="text-sm">✅</span>新建任务
        </div>
        <div class="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-[#2c2420] transition-all duration-100 hover:bg-[rgba(224,136,80,0.12)] hover:text-[#e08850]" @click="action('create-app')">
          <span class="text-sm">➕</span>新建应用
        </div>
        <div class="mx-2 my-1 h-px bg-black/[0.06]" />
        <div class="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-[#2c2420] transition-all duration-100 hover:bg-[rgba(224,136,80,0.12)] hover:text-[#e08850]" @click="refresh">
          <span class="text-sm">🔄</span>刷新
        </div>
        <div class="mx-2 my-1 h-px bg-black/[0.06]" />
        <div class="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-[#2c2420] transition-all duration-100 hover:bg-[rgba(224,136,80,0.12)] hover:text-[#e08850]" @click="$emit('wallpaper'); close()">
          <span class="text-sm">🖼️</span>更换壁纸
        </div>
        <div class="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-[#2c2420] transition-all duration-100 hover:bg-[rgba(224,136,80,0.12)] hover:text-[#e08850]" @click="action('settings')">
          <span class="text-sm">⚙️</span>系统设置
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { windowManager } from '../../stores/windowManager.ts';

defineEmits(['wallpaper']);

const visible = ref(false);
const x = ref(0);
const y = ref(0);

function show(e) {
  x.value = Math.min(e.clientX, window.innerWidth - 200);
  y.value = Math.min(e.clientY, window.innerHeight - 260);
  visible.value = true;
}

function close() {
  visible.value = false;
}

function action(appId) {
  close();
  windowManager.open(appId);
}

function refresh() {
  close();
  location.reload();
}

defineExpose({ show });
</script>

<style scoped>
/* 毛玻璃 + 多层 shadow — 必须原生 */
.ctx-menu {
  background: rgba(255,255,255,0.78);
  backdrop-filter: blur(24px) saturate(1.5);
  -webkit-backdrop-filter: blur(24px) saturate(1.5);
  border: 1px solid rgba(255,255,255,0.5);
  box-shadow: 0 8px 32px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.06);
}
</style>
