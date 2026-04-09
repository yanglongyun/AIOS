<template>
  <div class="flex h-[54px] shrink-0 items-center border-b border-[rgba(200,170,130,0.4)] bg-[rgba(250,245,238,0.9)] px-4 shadow-[0_2px_16px_rgba(90,62,40,0.07)] backdrop-blur-2xl">
    <!-- 应用打开状态 -->
    <template v-if="app">
      <!-- 二级页面：返回箭头 + 动态标题 -->
      <template v-if="nav.back">
        <button
          class="mr-2 flex h-[34px] w-[34px] items-center justify-center rounded-full text-[#5a3e28] transition-all active:bg-[rgba(200,160,96,0.12)]"
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
        class="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-[rgba(180,150,110,0.35)] bg-[rgba(255,255,255,0.35)] text-[#5a3e28] shadow-[0_1px_0_rgba(255,255,255,0.45),inset_0_1px_0_rgba(255,255,255,0.35)] transition-all active:bg-[rgba(200,160,96,0.12)]"
        @click="$emit('close')"
      >
        <span class="block h-[2px] w-[10px] rounded-full bg-current opacity-75"></span>
      </button>
    </template>

    <!-- 默认状态 -->
    <template v-else>
      <div class="flex-1 text-[15px] font-bold text-[#3a2a18]">AIOS</div>
      <button
        ref="avatarBtn"
        class="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-transparent bg-[rgba(200,160,96,0.15)] text-[12px] font-semibold text-[#5a3e28] transition-all active:border-[rgba(200,160,96,0.25)] active:bg-[rgba(200,160,96,0.12)]"
        @click.stop="$emit('toggle-menu', avatarBtn)"
      >{{ usernameInitial }}</button>
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { getApp } from '../../apps.js';
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
  const a = getApp(props.app.appId);
  return a ? a.name : '';
});
const appIcon = computed(() => {
  if (!props.app) return '';
  return getApp(props.app.appId)?.icon || '';
});
</script>
