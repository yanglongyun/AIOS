<template>
  <nav class="flex h-full flex-col overflow-hidden bg-gradient-to-b from-[#3a2a1a] to-[#2e2014] font-['Georgia','PingFang_SC',serif]">
    <div class="px-3 pb-2 pt-4">
      <div class="mb-1 flex items-center justify-between px-2">
        <span class="text-[11px] tracking-[0.08em] text-[#8a7050]">对话</span>
        <button @click="goNewSession" title="新对话" class="flex h-[18px] w-[18px] items-center justify-center rounded-[5px] bg-white/10 text-sm leading-none text-[#8a7050] transition-all hover:bg-white/20 hover:text-[#e0c8a0]">+</button>
      </div>
      <button @click="goLastChat" class="relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all duration-150" :class="btnClass(isChatNew)">
        <span class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-white/5 text-[11px]">✦</span>
        对话
      </button>
      <button @click="goHistory" class="relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all duration-150" :class="btnClass(isChatHistory)">
        <span class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-white/5 text-[11px]">◷</span>
        历史
      </button>
    </div>

    <div class="flex min-h-0 flex-1 flex-col px-3 pb-2">
      <div class="mb-1 flex items-center justify-between px-2">
        <span class="text-[11px] tracking-[0.08em] text-[#8a7050]">应用</span>
        <button @click="go('/apps/create')" title="创建应用" class="flex h-[18px] w-[18px] items-center justify-center rounded-[5px] bg-white/10 text-sm leading-none text-[#8a7050] transition-all hover:bg-white/20 hover:text-[#e0c8a0]">+</button>
      </div>

      <div class="flex-1 space-y-0.5 overflow-y-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button @click="go('/notebook')" class="relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all duration-150" :class="btnClass(is('/notebook'))"><span class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-white/5 text-[11px]">📝</span>随心记</button>
        <button @click="go('/finance')" class="relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all duration-150" :class="btnClass(is('/finance'))"><span class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-white/5 text-[11px]">💰</span>记账本</button>
        <button @click="go('/inbox')" class="relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all duration-150" :class="btnClass(is('/inbox'))"><span class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-white/5 text-[11px]">📬</span>收件箱</button>
        <button @click="go('/playground')" class="relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all duration-150" :class="btnClass(is('/playground'))"><span class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-white/5 text-[11px]">⚡</span>空间工坊</button>
        <button @click="go('/writerpad')" class="relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all duration-150" :class="btnClass(route.path.startsWith('/writerpad'))"><span class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-white/5 text-[11px]">📄</span>写字板</button>
        <button @click="go('/debate-simulator')" class="relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all duration-150" :class="btnClass(route.path.startsWith('/debate-simulator'))"><span class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-white/5 text-[11px]">🎤</span>竞选模拟器</button>
        <button @click="go('/treasure')" class="relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all duration-150" :class="btnClass(route.path.startsWith('/treasure'))"><span class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-white/5 text-[11px]">🔍</span>藏宝阁</button>
        <button @click="go('/briefing')" class="relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all duration-150" :class="btnClass(route.path.startsWith('/briefing'))"><span class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-white/5 text-[11px]">📰</span>专属早报</button>
        <button @click="go('/lifeguide')" class="relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all duration-150" :class="btnClass(route.path.startsWith('/lifeguide'))"><span class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-white/5 text-[11px]">🌱</span>生活指导</button>
        <button @click="go('/cryptobot')" class="relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all duration-150" :class="btnClass(route.path.startsWith('/cryptobot'))"><span class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-white/5 text-[11px]">📈</span>炒币机</button>
        <button @click="go('/story')" class="relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all duration-150" :class="btnClass(route.path.startsWith('/story'))"><span class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-white/5 text-[11px]">📚</span>故事机</button>
        <button @click="go('/lovehouse')" class="relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all duration-150" :class="btnClass(is('/lovehouse'))"><span class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-white/5 text-[11px]">❤️</span>窗口</button>
        <button @click="go('/nokia')" class="relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all duration-150" :class="btnClass(is('/nokia'))"><span class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-white/5 text-[11px]">📱</span>老手机</button>
      </div>
    </div>

    <div class="border-t border-white/10 px-3 pb-3 pt-2">
      <button @click="go('/community')" class="relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all duration-150" :class="btnClass(is('/community'))">
        <span class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-white/5 text-[11px]">👥</span>
        社区
      </button>
      <button @click="go('/settings')" class="relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all duration-150" :class="btnClass(is('/settings'))">
        <span class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-white/5 text-[11px]">⚙️</span>
        设置
      </button>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const emit = defineEmits(['navigate']);
const route = useRoute();
const router = useRouter();

const isChatNew = computed(() => route.path.startsWith('/chat'));
const isChatHistory = computed(() => route.path === '/history');
const is = (path) => route.path === path;

const btnClass = (active) => active
  ? 'bg-[rgba(200,160,100,0.15)] text-[#e8d0a8] shadow-[inset_3px_0_0_0_#c8a060]'
  : 'text-[#b8a080] hover:bg-white/5 hover:text-[#e0c8a0]';

const go = (path) => {
  emit('navigate');
  router.push(path);
};

const goNewSession = async () => {
  emit('navigate');
  await router.push({ path: '/chat', query: { new: String(Date.now()) } });
};

const goLastChat = async () => {
  emit('navigate');
  const lastId = localStorage.getItem('lastChatId');
  if (lastId) {
    await router.push(`/chat/${lastId}`);
  } else {
    await router.push({ path: '/chat', query: { new: String(Date.now()) } });
  }
};

const goHistory = async () => {
  emit('navigate');
  await router.push('/history');
};
</script>
