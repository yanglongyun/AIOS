<script setup>
import { useViewStore } from '@/stores/view.js';
import AskAI from '@/components/AskAI.vue';

const view = useViewStore();

defineProps({
  title:     { type: String,  default: '' },
  // 该 app 是否有内部抽屉(会话列表 / 筛选等),控制左上角 ☰
  hasDrawer: { type: Boolean, default: false },
  // 返回模式:左侧显示 ← 而非 ☰(如任务详情页)
  back:      { type: Boolean, default: false },
  // 是否在右侧内置「问 AI」按钮
  askAi:     { type: Boolean, default: true },
});

defineEmits(['back']);
</script>

<template>
  <header class="app-topbar">
    <!-- 返回 -->
    <button v-if="back" class="icon-btn lg" title="返回" @click="$emit('back')">
      <span class="msi">arrow_back</span>
    </button>
    <!-- 本 app 内部抽屉(全局导航由常驻侧边栏负责,这里不再放全局按钮) -->
    <button v-else-if="hasDrawer" class="icon-btn lg" :class="{ active: view.appDrawerOpen }"
      title="侧栏" @click="view.toggleAppDrawer()">
      <span class="msi">menu</span>
    </button>

    <div class="app-topbar__title">
      <slot name="title">{{ title }}</slot>
    </div>

    <div class="app-topbar__actions">
      <slot name="actions" />
      <AskAI v-if="askAi" />
    </div>
  </header>
</template>
