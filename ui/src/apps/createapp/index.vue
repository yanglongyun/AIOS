<template>
  <div class="flex h-full flex-col bg-[#f5f0e8] font-['Georgia','PingFang_SC',serif]">
    <!-- Top: Hero + Input (sticky) -->
    <div class="shrink-0 px-6 pt-6 pb-4">
      <CreateAppHero />
      <div class="mt-5 flex gap-2 max-w-[520px] mx-auto">
        <input
          ref="inputRef"
          v-model="prompt"
          class="flex-1 rounded-xl border border-[#d4c0a0] bg-[#fffdf8] px-4 py-2.5 text-sm text-[#4a3a28] placeholder-[#b0a090] outline-none focus:border-[#c8a060] transition-colors"
          placeholder="__T_CREATEAPP_PLACEHOLDER__"
          @compositionstart="composing = true"
          @compositionend="composing = false"
          @keydown.enter="!composing && create()"
        />
        <button
          class="rounded-xl bg-[#5a3e28] px-5 py-2.5 text-sm text-[#f0e8d8] shadow-[0_2px_8px_rgba(90,62,40,0.3)] transition-opacity hover:opacity-90 disabled:opacity-40"
          :disabled="!prompt.trim()"
          @click="create"
        >
          __T_CREATEAPP_BUTTON__
        </button>
      </div>
    </div>

    <!-- Category tabs -->
    <div class="shrink-0 px-6 pb-3">
      <div class="flex gap-2 max-w-[520px] mx-auto">
        <button v-for="cat in categories" :key="cat.key"
          class="px-3 py-1.5 rounded-lg text-[12px] transition-all"
          :class="activeCategory === cat.key
            ? 'bg-[#5a3e28] text-[#f0e8d8] shadow-sm'
            : 'bg-[#ebe6dc] text-[#8a7a68] hover:bg-[#e0d9cd]'"
          @click="activeCategory = cat.key">
          {{ cat.emoji }} {{ cat.label }}
        </button>
      </div>
    </div>

    <!-- Template cards grid -->
    <div class="flex-1 overflow-y-auto px-6 pb-6">
      <div class="grid grid-cols-2 gap-3 max-w-[520px] mx-auto">
        <div v-for="tpl in filteredTemplates" :key="tpl.name"
          class="group cursor-pointer rounded-xl border border-[#e4ddd0] bg-[#fffdf8] p-3.5 transition-all hover:border-[#c8a060] hover:shadow-[0_4px_12px_rgba(90,62,40,0.08)] hover:-translate-y-0.5"
          @click="selectTemplate(tpl)">
          <div class="flex items-center gap-2 mb-1.5">
            <span class="text-base">{{ tpl.emoji }}</span>
            <span class="text-[13px] font-semibold text-[#5a4a38]">{{ tpl.name }}</span>
          </div>
          <p class="text-[11px] leading-[1.6] text-[#a09080]">{{ tpl.desc }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import CreateAppHero from './CreateAppHero.vue';
import { windowManager } from '../../stores/windowManager.js';

const prompt = ref('');
const composing = ref(false);
const inputRef = ref(null);
const activeCategory = ref('all');

const categories = [
  { key: 'all', emoji: '✨', label: '__T_CREATEAPP_CAT_ALL__' },
  { key: 'ai', emoji: '🧠', label: '__T_CREATEAPP_CAT_AI__' },
  { key: 'tool', emoji: '🔧', label: '__T_CREATEAPP_CAT_TOOL__' },
  { key: 'game', emoji: '🎮', label: '__T_CREATEAPP_CAT_GAME__' },
  { key: 'life', emoji: '🌿', label: '__T_CREATEAPP_CAT_LIFE__' },
];

const templates = [
  { cat: 'ai', emoji: '📊', name: '__T_CREATEAPP_TPL_COMPETITOR__', desc: '__T_CREATEAPP_TPL_COMPETITOR_DESC__' },
  { cat: 'ai', emoji: '✍️', name: '__T_CREATEAPP_TPL_COPYWRITER__', desc: '__T_CREATEAPP_TPL_COPYWRITER_DESC__' },
  { cat: 'ai', emoji: '📋', name: '__T_CREATEAPP_TPL_PROPOSAL__', desc: '__T_CREATEAPP_TPL_PROPOSAL_DESC__' },
  { cat: 'ai', emoji: '🧑‍💼', name: '__T_CREATEAPP_TPL_INTERVIEW__', desc: '__T_CREATEAPP_TPL_INTERVIEW_DESC__' },
  { cat: 'ai', emoji: '🗺️', name: '__T_CREATEAPP_TPL_MINDMAP__', desc: '__T_CREATEAPP_TPL_MINDMAP_DESC__' },
  { cat: 'ai', emoji: '🎭', name: '__T_CREATEAPP_TPL_PERSONA__', desc: '__T_CREATEAPP_TPL_PERSONA_DESC__' },
  { cat: 'tool', emoji: '🔑', name: '__T_CREATEAPP_TPL_PASSWORD__', desc: '__T_CREATEAPP_TPL_PASSWORD_DESC__' },
  { cat: 'tool', emoji: '🎨', name: '__T_CREATEAPP_TPL_COLOR__', desc: '__T_CREATEAPP_TPL_COLOR_DESC__' },
  { cat: 'tool', emoji: '📐', name: '__T_CREATEAPP_TPL_REGEX__', desc: '__T_CREATEAPP_TPL_REGEX_DESC__' },
  { cat: 'game', emoji: '🐍', name: '__T_CREATEAPP_TPL_SNAKE__', desc: '__T_CREATEAPP_TPL_SNAKE_DESC__' },
  { cat: 'game', emoji: '🃏', name: '__T_CREATEAPP_TPL_MEMORY__', desc: '__T_CREATEAPP_TPL_MEMORY_DESC__' },
  { cat: 'game', emoji: '⚔️', name: '__T_CREATEAPP_TPL_ADVENTURE__', desc: '__T_CREATEAPP_TPL_ADVENTURE_DESC__' },
  { cat: 'life', emoji: '🍳', name: '__T_CREATEAPP_TPL_RECIPE__', desc: '__T_CREATEAPP_TPL_RECIPE_DESC__' },
  { cat: 'life', emoji: '⏳', name: '__T_CREATEAPP_TPL_COUNTDOWN__', desc: '__T_CREATEAPP_TPL_COUNTDOWN_DESC__' },
];

const filteredTemplates = computed(() =>
  activeCategory.value === 'all' ? templates : templates.filter(t => t.cat === activeCategory.value)
);

const selectTemplate = (tpl) => {
  prompt.value = tpl.desc;
  inputRef.value?.focus();
};

const create = () => {
  if (!prompt.value.trim()) return;
  windowManager.open('chat', { pendingMessage: prompt.value.trim() });
  prompt.value = '';
};
</script>
