<template>
  <div
    class="h-screen w-screen overflow-hidden bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200"
    style="height: 100dvh;"
    :style="{
      display: sidebarOpen ? 'grid' : 'flex',
      gridTemplateColumns: sidebarOpen ? '290px 1fr' : undefined,
    }"
  >
    <div v-if="sidebarOpen" @click="sidebarOpen = false" class="fixed inset-0 bg-black/50 z-40 md:hidden" />
    <!-- 移动端：fixed 浮层；桌面端：grid 列 -->
    <div v-show="sidebarOpen" class="fixed inset-y-0 left-0 z-50 w-[290px] md:relative md:z-auto md:inset-auto md:w-auto">
      <Sidebar @close="sidebarOpen = false" />
    </div>
    <RouterView v-slot="{ Component }">
      <component
        :is="Component"
        :sidebarOpen="sidebarOpen"
        @toggle-sidebar="sidebarOpen = !sidebarOpen"
        @open-sidebar="sidebarOpen = true"
      />
    </RouterView>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { RouterView } from 'vue-router';
import Sidebar from './components/Sidebar.vue';

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
