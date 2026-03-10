<template>
  <template v-if="view === 'list'">
    <div class="beam shrink-0 relative z-20 flex h-[50px] items-center justify-between px-5">
      <span></span>
      <span class="font-serif text-[15px] font-extrabold tracking-wider text-[#fff8ee] [text-shadow:0_1px_3px_rgba(0,0,0,.3)]">{{ t('reader_shelf_spaced') }}</span>
      <span></span>
    </div>
    <div class="wood-dark flex-1 overflow-y-auto">
      <div v-if="!sessions.length" class="flex h-full items-center justify-center text-[13px] text-[#9a8060]">{{ t('reader_empty') }}</div>
      <template v-else>
        <div v-for="(tier, ti) in shelfTiers" :key="ti" class="relative">
          <div class="book-row relative z-[2] grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-x-2.5 gap-y-3 px-5 pb-[18px] pt-8">
            <button
              v-for="(s, i) in tier"
              :key="s.id"
              class="book flex cursor-pointer flex-col items-center gap-1.5 border-none bg-transparent p-0 font-inherit text-inherit"
              @click="$emit('select-session', s.id)"
            >
              <div class="book-cover relative flex w-full flex-col justify-end overflow-hidden rounded-[2px_6px_6px_2px] p-[10px_9px_9px]" :class="'c' + ((ti * 4 + i) % 9)" style="aspect-ratio:2/3">
                <div class="cover-frame"></div>
                <div class="relative z-[1]">
                  <div class="font-serif text-[13px] font-extrabold leading-tight text-left [text-shadow:0_1px_4px_rgba(0,0,0,.6)]">{{ s.title }}</div>
                  <div class="my-1 h-[1.5px] w-[22px] bg-current opacity-35"></div>
                  <div class="text-[9px] tracking-wider opacity-55">{{ t('reader_chapter_count', { n: s.chapterCount || 0 }) }}</div>
                </div>
              </div>
              <div class="w-full truncate text-center text-[10px] font-semibold text-[#6a5838]">{{ s.title }}</div>
            </button>
            <button
              v-if="ti === shelfTiers.length - 1"
              class="book book-add flex cursor-pointer flex-col items-center gap-1.5 border-none bg-transparent p-0 font-inherit"
              @click="$emit('open-create')"
            >
              <div class="book-cover flex w-full items-center justify-center overflow-hidden rounded-[2px_6px_6px_2px] p-0" style="aspect-ratio:2/3">
                <span class="text-[28px] text-black/15">+</span>
              </div>
              <div class="w-full truncate text-center text-[10px] font-semibold text-[#5a4828]">{{ t('reader_create') }}</div>
            </button>
          </div>
          <div class="plank wood-plank relative z-[3] h-[22px]"></div>
          <div class="plank-shadow relative z-[1] h-[18px]"></div>
        </div>
      </template>
    </div>
  </template>
</template>

<script setup>
import { useI18n } from '../../../i18n/index.js';

const { t } = useI18n();

defineProps({
  view: { type: String, required: true },
  sessions: { type: Array, required: true },
  shelfTiers: { type: Array, required: true }
});

defineEmits(['select-session', 'open-create']);
</script>
