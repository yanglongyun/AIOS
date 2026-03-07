<template>
  <nav
    class="group flex h-full flex-col overflow-hidden bg-transparent font-['Georgia','PingFang_SC',serif]">
    <!-- 对话区域 -->
    <div class="px-3 pb-2 pt-4">
      <div class="mb-1 flex items-center justify-between px-2">
        <span class="text-[11px] tracking-[0.08em] text-[#8a7050]">{{ t('app_sidebar_chat') }}</span>
        <button @click="goNewSession" :title="t('app_sidebar_new_chat')"
          class="flex h-[18px] w-[18px] items-center justify-center rounded-[5px] bg-white/10 text-[#8a7050] transition-all hover:bg-white/20 hover:text-[#e0c8a0]">
          <Plus class="h-3 w-3" />
        </button>
      </div>
      <button @click="goLastChat"
        class="relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all duration-150"
        :class="btnClass(isChatNew)">
        <span
          class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-white/5 text-[11px]">✦</span>
        {{ t('app_sidebar_chat') }}
      </button>
      <button @click="goHistory"
        class="relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all duration-150"
        :class="btnClass(isChatHistory)">
        <span
          class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-white/5 text-[11px]">◷</span>
        {{ t('app_sidebar_history') }}
      </button>
    </div>

    <!-- 应用区域 -->
    <div class="flex min-h-0 flex-1 flex-col px-3 pb-2">
      <div class="mb-1 flex items-center justify-between px-2">
        <span class="text-[11px] tracking-[0.08em] text-[#8a7050]">{{ t('app_sidebar_apps') }}</span>
        <button @click="go('/apps/create')" :title="t('app_sidebar_create_app')"
          class="flex h-[18px] w-[18px] items-center justify-center rounded-[5px] bg-white/10 text-[#8a7050] transition-all hover:bg-white/20 hover:text-[#e0c8a0]">
          <Plus class="h-3 w-3" />
        </button>
      </div>

      <div class="relative min-h-0 flex-1">
        <div ref="appListRef" class="app-list h-full space-y-0.5 overflow-y-auto pb-2 pr-2">
          <!-- 定时任务 - 第一位 -->
          <button @click="go('/schedule')"
            class="relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all duration-150"
            :class="btnClass(route.path.startsWith('/schedule'))"><span
              class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-white/5 text-[11px]">⏰</span>{{
                t('app_sidebar_schedule') }}</button>

          <!-- 每日打卡 -->
          <button @click="go('/dailycheck')"
            class="relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all duration-150"
            :class="btnClass(route.path.startsWith('/dailycheck'))"><span
              class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-white/5 text-[11px]">🌱</span>{{
                t('app_sidebar_dailycheck') }}</button>

          <button @click="go('/notebook')"
            class="relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all duration-150"
            :class="btnClass(is('/notebook'))"><span
              class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-white/5 text-[11px]">📝</span>{{
                t('app_sidebar_notebook') }}</button>
          <button @click="go('/finance')"
            class="relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all duration-150"
            :class="btnClass(is('/finance'))"><span
              class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-white/5 text-[11px]">💰</span>{{
                t('app_sidebar_finance') }}</button>
          <button @click="go('/inbox')"
            class="relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all duration-150"
            :class="btnClass(is('/inbox'))"><span
              class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-white/5 text-[11px]">📬</span>{{
                t('app_sidebar_inbox') }}</button>
          <button @click="go('/weibo')"
            class="relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all duration-150"
            :class="btnClass(is('/weibo'))"><span
              class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-white/5 text-[11px]">🪶</span>{{
                t('app_sidebar_weibo') }}</button>
          <button @click="go('/playground')"
            class="relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all duration-150"
            :class="btnClass(is('/playground'))"><span
              class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-white/5 text-[11px]">🌌</span>{{
                t('app_sidebar_playground') }}</button>
          <button @click="go('/debate-simulator')"
            class="relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all duration-150"
            :class="btnClass(route.path.startsWith('/debate-simulator'))"><span
              class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-white/5 text-[11px]">🃏</span>{{
                t('app_sidebar_debate') }}</button>
          <button @click="go('/treasure')"
            class="relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all duration-150"
            :class="btnClass(route.path.startsWith('/treasure'))"><span
              class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-white/5 text-[11px]">🔍</span>{{
                t('app_sidebar_treasure') }}</button>
          <button @click="go('/briefing')"
            class="relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all duration-150"
            :class="btnClass(route.path.startsWith('/briefing'))"><span
              class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-white/5 text-[11px]">📰</span>{{
                t('app_sidebar_briefing') }}</button>
          <button @click="go('/cryptobot')"
            class="relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all duration-150"
            :class="btnClass(route.path.startsWith('/cryptobot'))"><span
              class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-white/5 text-[11px]">📈</span>{{
                t('app_sidebar_cryptobot') }}</button>
          <button @click="go('/story')"
            class="relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all duration-150"
            :class="btnClass(route.path.startsWith('/story'))"><span
              class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-white/5 text-[11px]">📚</span>{{
                t('app_sidebar_story') }}</button>
          <button @click="go('/blackroom')"
            class="relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all duration-150"
            :class="btnClass(route.path.startsWith('/blackroom'))"><span
              class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-white/5 text-[11px]">⬛</span>{{
                t('app_sidebar_blackroom') }}</button>
          <button @click="go('/poker')"
            class="relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all duration-150"
            :class="btnClass(route.path.startsWith('/poker'))"><span
              class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-white/5 text-[11px]">🃏</span>{{
                t('app_sidebar_poker') }}</button>
          <button @click="go('/fortune')"
            class="relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all duration-150"
            :class="btnClass(route.path.startsWith('/fortune'))"><span
              class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-white/5 text-[11px]">🔮</span>{{
                t('app_sidebar_fortune') }}</button>
          <button @click="go('/beach')"
            class="relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all duration-150"
            :class="btnClass(route.path.startsWith('/beach'))"><span
              class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-white/5 text-[11px]">🏖️</span>{{
                t('app_sidebar_beach') }}</button>
          <button @click="go('/nokia')"
            class="relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all duration-150"
            :class="btnClass(is('/nokia'))"><span
              class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-white/5 text-[11px]">📱</span>{{
                t('app_sidebar_nokia') }}</button>
        </div>
        <div v-if="thumbVisible"
          class="pointer-events-none absolute bottom-1 right-0 top-0 w-[3px] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <div class="absolute left-0 right-0 rounded-full bg-[#c8a870]/55"
            :style="{ height: `${thumbHeight}px`, transform: `translateY(${thumbTop}px)` }" />
        </div>
      </div>
    </div>

    <!-- 底部 -->
    <div class="border-t border-white/10 px-3 pb-3 pt-2">
      <button @click="openCommunity"
        class="relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all duration-150"
        :class="btnClass(false)">
        <span
          class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-white/5 text-[11px]">👥</span>
        {{ t('app_sidebar_community') }}
      </button>
      <button @click="go('/settings')"
        class="relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all duration-150"
        :class="btnClass(is('/settings'))">
        <span
          class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-white/5 text-[11px]">⚙️</span>
        {{ t('app_sidebar_settings') }}
      </button>
    </div>
  </nav>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Plus } from 'lucide-vue-next';
import { useI18n } from '../i18n/index.js';

const emit = defineEmits(['navigate']);
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const appListRef = ref(null);
const thumbVisible = ref(false);
const thumbHeight = ref(0);
const thumbTop = ref(0);

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
  const lastId = localStorage.getItem('lastConversationId');
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

const openCommunity = () => {
  emit('navigate');
  const url = localStorage.getItem('communityUrl') || 'https://aios.chatnext.ai';
  window.open(url, '_blank', 'noopener,noreferrer');
};


const updateThumb = () => {
  const el = appListRef.value;
  if (!el) return;
  const { scrollTop, scrollHeight, clientHeight } = el;
  if (scrollHeight <= clientHeight + 1) {
    thumbVisible.value = false;
    return;
  }
  thumbVisible.value = true;
  const trackHeight = clientHeight - 4;
  const ratio = clientHeight / scrollHeight;
  const minThumb = 24;
  const h = Math.max(minThumb, Math.round(trackHeight * ratio));
  const maxTop = Math.max(0, trackHeight - h);
  const t = Math.round((scrollTop / (scrollHeight - clientHeight)) * maxTop);
  thumbHeight.value = h;
  thumbTop.value = t;
};

onMounted(async () => {
  await nextTick();
  const el = appListRef.value;
  if (!el) return;
  el.addEventListener('scroll', updateThumb, { passive: true });
  window.addEventListener('resize', updateThumb);
  updateThumb();
});

onUnmounted(() => {
  const el = appListRef.value;
  if (el) el.removeEventListener('scroll', updateThumb);
  window.removeEventListener('resize', updateThumb);
});
</script>

<style scoped>
.app-list {
  scrollbar-width: none;
}

.app-list::-webkit-scrollbar {
  display: none;
}
</style>
