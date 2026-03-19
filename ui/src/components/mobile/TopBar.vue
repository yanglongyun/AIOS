<template>
  <div class="flex h-[52px] shrink-0 items-center border-b border-[#e0d0b8] bg-[rgba(250,245,238,0.97)] px-4 backdrop-blur-xl">
    <!-- 应用打开状态 -->
    <template v-if="app">
      <!-- 二级页面：返回箭头 + 动态标题 -->
      <template v-if="nav.back">
        <button
          class="mr-2 flex h-[32px] w-[32px] items-center justify-center rounded-full text-[#7a6a58] transition-colors active:bg-[rgba(200,160,96,0.12)]"
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
        class="flex h-[32px] w-[32px] items-center justify-center rounded-full text-[#7a6a58] transition-colors active:bg-[rgba(200,160,96,0.12)]"
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
        class="flex h-[32px] w-[32px] items-center justify-center rounded-full bg-[rgba(200,160,96,0.22)] text-[13px] font-semibold text-[#5a3e28]"
        @click.stop="$emit('toggle-menu', avatarBtn)"
      >{{ usernameInitial }}</button>
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { X } from 'lucide-vue-next';
import { appRegistry } from '../../apps.js';
import { useI18n } from '../../i18n/index.js';

const { t } = useI18n();
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
  return a ? t(a.name) : '';
});
const appIcon = computed(() => {
  if (!props.app) return '';
  return appRegistry.find(r => r.id === props.app.appId)?.icon || '';
});
</script>
