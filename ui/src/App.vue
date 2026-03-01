<template>
  <div class="flex h-[100dvh] w-screen flex-col overflow-hidden bg-[#2a2218] font-['Georgia','PingFang_SC',serif]">

    <!-- 顶部栏：木纹书桌 -->
    <div class="relative z-[80] flex h-12 shrink-0 items-center gap-3.5 border-b-2 border-[#3a2010] bg-[linear-gradient(180deg,#5a3e28_0%,#4a3020_100%)] bg-[repeating-linear-gradient(90deg,transparent_0,transparent_3px,rgba(255,255,255,0.02)_3px,rgba(255,255,255,0.02)_4px)] px-4 shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
      <button @click="sidebarOpen = !sidebarOpen" class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-white/10 bg-white/10 text-[#d4c0a0] transition-all hover:bg-white/15 hover:text-[#f0e0c0]">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <rect x="1" y="2.5" width="14" height="1.5" rx="0.75"/>
          <rect x="1" y="7.25" width="14" height="1.5" rx="0.75"/>
          <rect x="1" y="12" width="14" height="1.5" rx="0.75"/>
        </svg>
      </button>
      <span class="text-base font-bold tracking-[0.12em] text-[#e8d4b8] [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">AIOS</span>
      <span class="ml-auto text-[10px] italic tracking-[0.1em] text-[#c0a878]">Personal System</span>
    </div>

    <!-- 下方：导航面板 + 内容区 -->
    <div class="relative flex min-h-0 flex-1">
      <div v-if="sidebarOpen" @click="sidebarOpen = false" class="fixed inset-0 z-[60] hidden bg-[rgba(22,14,8,0.45)] backdrop-blur-[1px] max-md:block" />
      <div v-show="sidebarOpen" class="relative z-[70] h-full w-[220px] shrink-0 border-r border-[#1a1008] bg-[linear-gradient(180deg,#3a2a1a_0%,#2e2014_100%)] bg-[repeating-linear-gradient(180deg,transparent_0,transparent_6px,rgba(255,255,255,0.01)_6px,rgba(255,255,255,0.01)_7px)] opacity-100 max-md:absolute max-md:inset-y-0 max-md:left-0 max-md:shadow-[4px_0_20px_rgba(0,0,0,0.5)]">
        <NavPanel @navigate="onNavigate" />
      </div>
      <div class="relative z-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
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

const onNavigate = () => {
  if (window.innerWidth < 768) sidebarOpen.value = false;
};

const onResize = () => {
  if (window.innerWidth < 768) sidebarOpen.value = false;
};

onMounted(() => {
  window.addEventListener('resize', onResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', onResize);
});
</script>
