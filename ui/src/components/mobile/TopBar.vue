<template>
  <div
    class="flex h-[44px] shrink-0 items-center px-4 backdrop-blur-2xl"
    :class="barClass"
  >
    <!-- 应用打开状态 -->
    <template v-if="app">
      <!-- 二级页面：返回箭头 + 动态标题 -->
      <template v-if="nav.back">
        <button
          class="mr-2 flex h-[28px] w-[28px] items-center justify-center rounded-full transition-all active:scale-90"
          :class="iconBtnClass"
          @click="nav.back"
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div class="flex-1 truncate text-[14px] font-semibold" :class="titleClass">{{ nav.title }}</div>
      </template>
      <!-- 默认：应用图标 + 应用名 -->
      <template v-else>
        <span class="mr-2 text-[20px] leading-none">{{ appIcon }}</span>
        <div class="flex-1 text-[14px] font-semibold" :class="titleClass">{{ appTitle }}</div>
      </template>

      <!-- 微信小程序风格关闭按钮 -->
      <button
        class="flex h-[26px] w-[26px] items-center justify-center rounded-full transition-all active:scale-90"
        :class="closeClass"
        @click="$emit('close')"
      >
        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </template>

    <!-- 默认状态 -->
    <template v-else>
      <div class="flex-1 text-[14px] font-semibold" :class="titleClass">AIOS</div>
      <button
        ref="avatarBtn"
        class="flex h-[26px] w-[26px] items-center justify-center rounded-full text-[11px] font-semibold transition-all active:scale-90"
        :class="avatarClass"
        @click.stop="$emit('toggle-menu', avatarBtn)"
      >{{ usernameInitial }}</button>
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { getApp } from '../../apps.js';
import { desktopTheme } from '../../stores/appearance.js';

const avatarBtn = ref(null);

const props = defineProps({
  app: { type: Object, default: null },
  nav: { type: Object, required: true },
  username: { type: String, default: '' }
});

defineEmits(['close', 'toggle-menu']);

const isDark = computed(() => desktopTheme.value === 'dark');

const barClass = computed(() => isDark.value
  ? 'border-b border-white/[0.07] bg-[#0f1322]/[0.82] shadow-[0_1px_0_rgba(255,255,255,0.03)]'
  : 'border-b border-black/[0.06] bg-white/[0.88] shadow-[0_1px_0_rgba(0,0,0,0.04)]');

const titleClass = computed(() => isDark.value ? 'text-white' : 'text-[#1a1a1a]');

const iconBtnClass = computed(() => isDark.value
  ? 'text-white/70 hover:bg-white/[0.1]'
  : 'text-black/50 hover:bg-black/[0.06]');

const closeClass = computed(() => isDark.value
  ? 'bg-white/[0.12] text-white/65 hover:bg-white/[0.18]'
  : 'bg-black/[0.07] text-black/45 hover:bg-black/[0.12]');

const avatarClass = computed(() => isDark.value
  ? 'bg-white/[0.1] text-white/75 hover:bg-white/[0.16]'
  : 'bg-black/[0.07] text-black/55 hover:bg-black/[0.12]');

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
