<template>
  <div class="flex h-[52px] shrink-0 items-center border-b border-[rgba(200,170,130,0.4)] bg-[rgba(250,245,238,0.88)] px-4 shadow-[0_2px_16px_rgba(90,62,40,0.07)] backdrop-blur-2xl">
    <!-- 应用打开状态 -->
    <template v-if="app">
      <!-- 二级页面：返回箭头 + 动态标题 -->
      <template v-if="nav.back">
        <button
          class="mr-2 flex h-[32px] w-[32px] items-center justify-center rounded-[8px] text-[#5a3e28] transition-all active:bg-[rgba(200,160,96,0.12)]"
          @click="nav.back"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div class="flex-1 truncate text-[15px] font-bold text-[#3a2a18]">{{ nav.title }}</div>
      </template>
      <!-- 默认：应用图标 + 应用名 -->
      <template v-else>
        <span class="mr-2 text-[22px] leading-none">{{ appIcon }}</span>
        <div class="flex-1 text-[15px] font-bold text-[#3a2a18]">{{ appTitle }}</div>
      </template>
      <button
        class="flex h-[32px] w-[32px] items-center justify-center rounded-[8px] text-[#5a3e28] transition-all active:bg-[rgba(200,160,96,0.12)]"
        @click="$emit('close')"
      >
        <X class="h-[18px] w-[18px]" />
      </button>
    </template>

    <!-- 默认状态 -->
    <template v-else>
      <div class="flex-1 text-[15px] font-bold text-[#3a2a18]">AIOS</div>
      <button
        ref="avatarBtn"
        class="flex h-[32px] w-[32px] items-center justify-center rounded-[8px] border border-transparent bg-[rgba(200,160,96,0.15)] text-[13px] font-semibold text-[#5a3e28] transition-all active:border-[rgba(200,160,96,0.25)] active:bg-[rgba(200,160,96,0.12)]"
        @click.stop="$emit('toggle-menu', avatarBtn)"
      >{{ usernameInitial }}</button>
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { X } from 'lucide-vue-next';
import { appRegistry } from '../../apps.js';
const avatarBtn = ref(null);

const props = defineProps({
  app: { type: Object, default: null },
  nav: { type: Object, required: true },
  username: { type: String, default: '' }
});

defineEmits(['close', 'toggle-menu']);

const usernameInitial = computed(() => (props.username || '?')[0].toUpperCase());
const appTitle = computed(() => {
  if (!props.app) return '';
  const a = appRegistry.find(r => r.id === props.app.appId);
  return a ? a.name : '';
});
const appIcon = computed(() => {
  if (!props.app) return '';
  return appRegistry.find(r => r.id === props.app.appId)?.icon || '';
});
</script>
