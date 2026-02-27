<template>
  <div class="h-screen w-screen overflow-hidden flex flex-col bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200" style="height: 100dvh;">

    <!-- 顶部栏：固定，全宽 -->
    <div class="flex items-center gap-3 px-3 h-11 shrink-0 border-b border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 z-30">
      <button @click="sidebarOpen = !sidebarOpen"
        class="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0">
        <svg class="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
          <rect x="1" y="2" width="2.5" height="12" rx="1"/>
          <rect x="5.5" y="2" width="2.5" height="12" rx="1"/>
          <rect x="10" y="2" width="2.5" height="12" rx="1"/>
        </svg>
      </button>
      <span class="text-sm font-semibold text-neutral-800 dark:text-neutral-200 tracking-tight">AIOS</span>
    </div>

    <!-- 下方：导航面板 + 内容区 -->
    <div class="flex flex-1 min-h-0 relative">
      <div v-if="sidebarOpen" @click="sidebarOpen = false"
        class="fixed inset-0 z-20 md:hidden" />
      <div v-show="sidebarOpen"
        class="shrink-0 w-[220px] h-full border-r border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 z-30 max-md:absolute max-md:inset-y-0 max-md:left-0 max-md:shadow-xl">
        <NavPanel />
      </div>
      <div class="flex-1 min-w-0 min-h-0 overflow-hidden">
        <RouterView />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { RouterView } from 'vue-router';
import NavPanel from './components/NavPanel.vue';

const sidebarOpen = ref(window.innerWidth >= 768);

const onResize = () => {
  if (window.innerWidth < 768) sidebarOpen.value = false;
};

onMounted(() => {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  window.addEventListener('resize', onResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', onResize);
});
</script>
