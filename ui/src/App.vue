<template>
  <div class="flex h-[100dvh] w-screen flex-col overflow-hidden bg-[#2a2218] font-['Georgia','PingFang_SC',serif]">

    <!-- 顶部栏 -->
    <div class="relative z-[80] flex h-12 shrink-0 items-center gap-3.5 border-b-2 border-[#3a2010] bg-[linear-gradient(180deg,#5a3e28_0%,#4a3020_100%)] bg-[repeating-linear-gradient(90deg,transparent_0,transparent_3px,rgba(255,255,255,0.02)_3px,rgba(255,255,255,0.02)_4px)] px-4 shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
      <button @click="sidebarOpen = !sidebarOpen" class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-white/10 bg-white/10 text-[#d4c0a0] transition-all hover:bg-white/15 hover:text-[#f0e0c0]">
        <Menu class="h-[14px] w-[14px]" />
      </button>
      <span class="text-base font-bold tracking-[0.12em] text-[#e8d4b8] [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">AIOS</span>
      <div class="ml-auto flex items-center gap-2">
        <!-- 通知 -->
        <button @click="togglePanel('notifications')" class="relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-white/10 bg-white/10 text-[#d4c0a0] transition-all hover:bg-white/15 hover:text-[#f0e0c0]">
          <Bell class="h-[14px] w-[14px]" />
          <span v-if="unreadCount > 0" class="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#c07060] px-0.5 text-[9px] font-bold text-white">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
        </button>
        <!-- 活动 -->
        <button @click="togglePanel('asks')" class="relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-white/10 bg-white/10 text-[#d4c0a0] transition-all hover:bg-white/15 hover:text-[#f0e0c0]">
          <LoaderCircle class="h-[14px] w-[14px]" :class="{ 'animate-spin': hasPending }" />
          <span v-if="askCount > 0" class="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#c8a060] px-0.5 text-[9px] font-bold text-[#2a1a0a]">{{ askCount > 99 ? '99+' : askCount }}</span>
        </button>
      </div>
    </div>

    <!-- 通知面板 -->
    <div v-if="activePanel === 'notifications'" class="fixed inset-0 z-[90]" @click.self="activePanel = null">
      <div class="absolute right-4 top-12 z-[91] flex max-h-[70vh] w-80 flex-col overflow-hidden rounded-lg border border-[#3a2010] bg-[#2e2014] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <div class="flex items-center justify-between border-b border-[#4a3828] px-4 py-2.5">
          <span class="text-sm font-bold text-[#e8d0a8]">通知</span>
          <span class="text-[10px] text-[#8a7860]">{{ unreadCount }} 条未读</span>
        </div>
        <div class="flex-1 overflow-y-auto">
          <div v-if="notifications.length === 0" class="px-4 py-8 text-center text-xs text-[#6a5840]">暂无通知</div>
          <div v-for="n in notifications" :key="n.id" class="border-b border-[#3a2818] px-4 py-2.5 last:border-b-0" :class="n.read ? 'opacity-60' : ''">
            <div class="flex items-center gap-2">
              <span class="rounded bg-[#4a3828] px-1.5 py-0.5 text-[10px] text-[#c8a060]">{{ n.app }}</span>
              <span v-if="!n.read" class="h-1.5 w-1.5 rounded-full bg-[#c07060]"></span>
              <span v-else class="text-[10px] text-[#7a9a6a]">已读</span>
              <span class="ml-auto text-[10px] text-[#6a5840]">{{ formatTime(n.created_at) }}</span>
            </div>
            <div class="mt-1 text-[11px] font-bold text-[#d8c0a0]">{{ n.title }}</div>
            <div v-if="n.content" class="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-[#b8a080]">{{ n.content }}</div>
            <div v-if="n.reply" class="mt-1 rounded bg-[#3a2818] px-2 py-1 text-[10px] text-[#a0907a]">AI: {{ n.reply }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 活动面板 -->
    <div v-if="activePanel === 'asks'" class="fixed inset-0 z-[90]" @click.self="activePanel = null">
      <div class="absolute right-4 top-12 z-[91] flex max-h-[70vh] w-80 flex-col overflow-hidden rounded-lg border border-[#3a2010] bg-[#2e2014] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <div class="flex items-center justify-between border-b border-[#4a3828] px-4 py-2.5">
          <span class="text-sm font-bold text-[#e8d0a8]">活动</span>
          <span class="text-[10px] text-[#8a7860]">最近 20 条</span>
        </div>
        <div class="flex-1 overflow-y-auto">
          <div v-if="asks.length === 0" class="px-4 py-8 text-center text-xs text-[#6a5840]">暂无活动</div>
          <div v-for="r in asks" :key="r.id" class="border-b border-[#3a2818] px-4 py-2.5 last:border-b-0">
            <div class="flex items-center gap-2">
              <span class="rounded bg-[#4a3828] px-1.5 py-0.5 text-[10px] text-[#c8a060]">{{ r.app }}</span>
              <span :class="r.status === 'done' ? 'text-[#7a9a6a]' : r.status === 'error' ? 'text-[#c07060]' : 'text-[#c8a060]'" class="text-[10px]">{{ r.status }}</span>
              <span class="ml-auto text-[10px] text-[#6a5840]">{{ formatTime(r.created_at) }}</span>
            </div>
            <div class="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[#b8a080]">{{ r.response || r.prompt?.slice(0, 80) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 下方：导航面板 + 内容区 -->
    <div class="relative flex min-h-0 flex-1">
      <div v-if="sidebarOpen" @click="sidebarOpen = false" class="fixed inset-0 z-[60] hidden bg-[rgba(22,14,8,0.45)] backdrop-blur-[1px] max-md:block" />
      <div v-show="sidebarOpen" class="relative z-[70] h-full w-[220px] shrink-0 border-r border-[#1a1008] bg-[repeating-linear-gradient(180deg,transparent_0,transparent_6px,rgba(255,255,255,0.04)_6px,rgba(255,255,255,0.04)_7px),linear-gradient(180deg,#3a2a1a_0%,#2e2014_100%)] opacity-100 max-md:absolute max-md:inset-y-0 max-md:left-0 max-md:shadow-[4px_0_20px_rgba(0,0,0,0.5)]">
        <NavPanel @navigate="onNavigate" />
      </div>
      <div class="relative z-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <RouterView />
      </div>
    </div>

    <GlobalToast />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { RouterView } from 'vue-router';
import { Bell, LoaderCircle, Menu } from 'lucide-vue-next';
import NavPanel from './components/NavPanel.vue';
import GlobalToast from './components/GlobalToast.vue';

const sidebarOpen = ref(window.innerWidth >= 768);
const activePanel = ref(null);
const asks = ref([]);
const notifications = ref([]);

const askCount = computed(() => asks.value.length);
const hasPending = computed(() => asks.value.some(r => r.status === 'pending'));
const unreadCount = computed(() => notifications.value.filter(n => !n.read).length);

const togglePanel = (name) => {
  activePanel.value = activePanel.value === name ? null : name;
};

const formatTime = (t) => {
  if (!t) return '';
  return t.slice(11, 16);
};

let pollTimer = null;

const fetchData = async () => {
  try {
    const [reqRes, notifRes] = await Promise.all([
      fetch('/api/ask?limit=20'),
      fetch('/api/notifications?limit=20')
    ]);
    asks.value = await reqRes.json();
    notifications.value = await notifRes.json();
  } catch {}
};

const onNavigate = () => {
  if (window.innerWidth < 768) sidebarOpen.value = false;
};

const onResize = () => {
  if (window.innerWidth < 768) sidebarOpen.value = false;
};

onMounted(() => {
  window.addEventListener('resize', onResize);
  fetchData();
  pollTimer = setInterval(fetchData, 10000);
});

onUnmounted(() => {
  window.removeEventListener('resize', onResize);
  if (pollTimer) clearInterval(pollTimer);
});
</script>
