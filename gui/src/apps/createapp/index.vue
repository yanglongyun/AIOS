<template>
  <div
    class="flex h-full flex-col"
    style="background:radial-gradient(circle at 20% 0%,#fdf7e9 0%,transparent 40%),radial-gradient(circle at 100% 100%,#fbefe4 0%,transparent 50%) #faf6ec;color:#332114"
  >

    <!-- Hero + input -->
    <div class="shrink-0 px-7 pb-5 pt-7">
      <div class="text-center">
        <h2 class="text-[24px] font-bold tracking-[-0.03em]" style="color:#332114">__T_CREATEAPP_TITLE__</h2>
        <p class="mt-1 text-[13px]" style="color:rgba(90,70,50,0.6)">__T_CREATEAPP_SUBTITLE__</p>
      </div>

      <div class="relative mx-auto mt-5" style="max-width:600px">
        <textarea
          ref="inputRef"
          v-model="prompt"
          rows="3"
          class="w-full resize-none rounded-[18px] border-[1.5px] bg-white px-5 py-4 pr-[120px] text-[13.5px] leading-[1.65] outline-none transition-all duration-[180ms] placeholder:text-[rgba(90,70,50,0.38)] focus:border-[rgba(140,100,60,0.55)] focus:shadow-[0_0_0_4px_rgba(200,140,70,0.1),0_4px_16px_rgba(140,100,60,0.08)]"
          style="border-color:rgba(140,100,60,0.18);color:#332114"
          placeholder="__T_CREATEAPP_PLACEHOLDER__"
          @compositionstart="composing = true"
          @compositionend="composing = false"
          @keydown.meta.enter.prevent="create"
          @keydown.ctrl.enter.prevent="create"
        />
        <button
          class="absolute bottom-3 right-3 inline-flex h-8 items-center gap-1.5 rounded-full px-4 text-[12px] font-bold shadow-[0_2px_8px_rgba(92,67,50,0.35)] transition hover:brightness-110 hover:shadow-[0_3px_12px_rgba(92,67,50,0.45)] disabled:cursor-not-allowed disabled:opacity-35"
          style="background:linear-gradient(135deg,#7a5430 0%,#5c4332 100%);color:#fff6e0"
          :disabled="!prompt.trim()"
          @click="create"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6 L10 6 M6 2 L10 6 L6 10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          __T_CREATEAPP_BUTTON__
        </button>
      </div>
    </div>

    <!-- Category strip -->
    <div class="shrink-0 border-b px-7 pb-3" style="border-color:rgba(90,70,50,0.08)">
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="cat in categories" :key="cat.key"
          class="inline-flex items-center gap-1.5 rounded-full bg-[rgba(140,100,60,0.06)] px-3 py-[5px] text-[11.5px] font-semibold text-[rgba(90,70,50,0.65)] transition hover:bg-[rgba(140,100,60,0.12)] hover:text-[#332114]"
          :style="activeCategory === cat.key ? `background:${cat.color};color:#fff;box-shadow:0 2px 6px ${cat.color}55` : ''"
          @click="activeCategory = cat.key"
        >
          <span class="text-[13px]">{{ cat.emoji }}</span>
          {{ cat.label }}
        </button>
      </div>
    </div>

    <!-- Gallery -->
    <div class="min-h-0 flex-1 overflow-y-auto px-7 pb-8 pt-4 [scrollbar-width:thin]">
      <div class="grid grid-cols-2 gap-3">
        <button
          v-for="tpl in filteredTemplates" :key="tpl.name"
          class="group relative flex flex-col rounded-[18px] border-[1.5px] bg-[#fbf5e8] px-4 pb-4 pt-3.5 text-left transition-all hover:bg-[#fdf9ee] hover:-translate-y-px"
          :class="selectedTpl === tpl.name
            ? 'border-[rgba(140,100,60,0.55)] shadow-[0_0_0_3px_rgba(140,100,60,0.15),0_4px_12px_rgba(90,70,50,0.08)]'
            : 'border-[rgba(140,100,60,0.1)] shadow-[0_1px_3px_rgba(90,70,50,0.04)] hover:border-[rgba(140,100,60,0.28)] hover:shadow-[0_6px_18px_rgba(90,70,50,0.09)]'"
          @click="selectTemplate(tpl)"
        >
          <div class="mb-1 flex items-center gap-2">
            <span class="text-[18px]">{{ tpl.emoji }}</span>
            <span class="truncate text-[13px] font-bold" style="color:#332114">{{ tpl.name }}</span>
          </div>
          <p class="line-clamp-3 text-[11.5px] leading-[1.6]" style="color:rgba(90,70,50,0.58)">{{ tpl.desc }}</p>
        </button>
      </div>

      <div v-if="!filteredTemplates.length" class="py-10 text-center text-[12.5px]" style="color:rgba(90,70,50,0.4)">
        __T_CREATEAPP_EMPTY_CATEGORY__
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { openIntent } from '../../system/intent.js';

const prompt = ref('');
const composing = ref(false);
const inputRef = ref(null);
const activeCategory = ref('all');
const selectedTpl = ref(null);

const categories = [
  { key: 'all',          emoji: '✨', label: '__T_CREATEAPP_CAT_ALL__',          color: '#6a5a46' },
  { key: 'ai',           emoji: '🧠', label: '__T_CREATEAPP_CAT_AI__',           color: '#8b6fc7' },
  { key: 'tool',         emoji: '🔧', label: '__T_CREATEAPP_CAT_TOOL__',         color: '#5a7ba8' },
  { key: 'game',         emoji: '🎮', label: '__T_CREATEAPP_CAT_GAME__',         color: '#c66f93' },
  { key: 'life',         emoji: '🌿', label: '__T_CREATEAPP_CAT_LIFE__',         color: '#6fa87b' },
  { key: 'business',     emoji: '💼', label: '__T_CREATEAPP_CAT_BUSINESS__',     color: '#c78c4a' },
  { key: 'productivity', emoji: '⚡', label: '__T_CREATEAPP_CAT_PRODUCTIVITY__', color: '#5a9e9c' }
];

const templates = [
  { cat: 'ai',           emoji: '📊',  name: '__T_CREATEAPP_TPL_COMPETITOR__', desc: '__T_CREATEAPP_TPL_COMPETITOR_DESC__' },
  { cat: 'ai',           emoji: '✍️',  name: '__T_CREATEAPP_TPL_COPYWRITER__', desc: '__T_CREATEAPP_TPL_COPYWRITER_DESC__' },
  { cat: 'ai',           emoji: '📋',  name: '__T_CREATEAPP_TPL_PROPOSAL__',   desc: '__T_CREATEAPP_TPL_PROPOSAL_DESC__' },
  { cat: 'ai',           emoji: '🧑‍💼', name: '__T_CREATEAPP_TPL_INTERVIEW__',  desc: '__T_CREATEAPP_TPL_INTERVIEW_DESC__' },
  { cat: 'ai',           emoji: '🗺️',  name: '__T_CREATEAPP_TPL_MINDMAP__',    desc: '__T_CREATEAPP_TPL_MINDMAP_DESC__' },
  { cat: 'ai',           emoji: '🎭',  name: '__T_CREATEAPP_TPL_PERSONA__',    desc: '__T_CREATEAPP_TPL_PERSONA_DESC__' },
  { cat: 'tool',         emoji: '🔑',  name: '__T_CREATEAPP_TPL_PASSWORD__',   desc: '__T_CREATEAPP_TPL_PASSWORD_DESC__' },
  { cat: 'tool',         emoji: '🎨',  name: '__T_CREATEAPP_TPL_COLOR__',      desc: '__T_CREATEAPP_TPL_COLOR_DESC__' },
  { cat: 'tool',         emoji: '📐',  name: '__T_CREATEAPP_TPL_REGEX__',      desc: '__T_CREATEAPP_TPL_REGEX_DESC__' },
  { cat: 'game',         emoji: '🐍',  name: '__T_CREATEAPP_TPL_SNAKE__',      desc: '__T_CREATEAPP_TPL_SNAKE_DESC__' },
  { cat: 'game',         emoji: '🃏',  name: '__T_CREATEAPP_TPL_MEMORY__',     desc: '__T_CREATEAPP_TPL_MEMORY_DESC__' },
  { cat: 'game',         emoji: '⚔️',  name: '__T_CREATEAPP_TPL_ADVENTURE__',  desc: '__T_CREATEAPP_TPL_ADVENTURE_DESC__' },
  { cat: 'life',         emoji: '🍳',  name: '__T_CREATEAPP_TPL_RECIPE__',     desc: '__T_CREATEAPP_TPL_RECIPE_DESC__' },
  { cat: 'life',         emoji: '⏳',  name: '__T_CREATEAPP_TPL_COUNTDOWN__',  desc: '__T_CREATEAPP_TPL_COUNTDOWN_DESC__' },
  { cat: 'business',     emoji: '📦',  name: '__T_CREATEAPP_TPL_INVENTORY__',  desc: '__T_CREATEAPP_TPL_INVENTORY_DESC__' },
  { cat: 'business',     emoji: '🧾',  name: '__T_CREATEAPP_TPL_QUOTE__',      desc: '__T_CREATEAPP_TPL_QUOTE_DESC__' },
  { cat: 'business',     emoji: '👥',  name: '__T_CREATEAPP_TPL_CRM__',        desc: '__T_CREATEAPP_TPL_CRM_DESC__' },
  { cat: 'productivity', emoji: '📆',  name: '__T_CREATEAPP_TPL_CALENDAR__',   desc: '__T_CREATEAPP_TPL_CALENDAR_DESC__' },
  { cat: 'productivity', emoji: '🗂️',  name: '__T_CREATEAPP_TPL_BOARD__',      desc: '__T_CREATEAPP_TPL_BOARD_DESC__' },
  { cat: 'productivity', emoji: '⏱️',  name: '__T_CREATEAPP_TPL_POMODORO__',   desc: '__T_CREATEAPP_TPL_POMODORO_DESC__' }
];

const filteredTemplates = computed(() =>
  activeCategory.value === 'all' ? templates : templates.filter(t => t.cat === activeCategory.value)
);

const selectTemplate = (tpl) => {
  prompt.value = tpl.desc;
  selectedTpl.value = tpl.name;
  inputRef.value?.focus();
};

const create = () => {
  if (!prompt.value.trim() || composing.value) return;
  openIntent({
    app: 'chat',
    action: 'open_new_and_send',
    data: { message: prompt.value.trim() }
  });
  prompt.value = '';
  selectedTpl.value = null;
};
</script>
