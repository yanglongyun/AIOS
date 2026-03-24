<template>
  <template v-if="view === 'create'">
    <div class="beam shrink-0 relative z-20 flex h-[50px] items-center justify-between px-5">
      <button class="relative top-0 flex cursor-pointer items-center gap-1 rounded-md border border-black/20 bg-[linear-gradient(180deg,rgba(255,255,255,.12),rgba(0,0,0,.08))] px-3 py-1 pl-2 text-xs font-semibold text-[#fff8ee] [text-shadow:0_1px_2px_rgba(0,0,0,.4)] shadow-[0_2px_0_rgba(0,0,0,.25),inset_0_1px_0_rgba(255,240,200,.12)] transition-all hover:bg-[linear-gradient(180deg,rgba(255,255,255,.18),rgba(0,0,0,.04))] active:top-[2px] active:shadow-[0_0_0_rgba(0,0,0,.25),inset_0_1px_3px_rgba(0,0,0,.2)]" @click="$emit('back')">
        <svg class="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
        {{ t('reader_back') }}
      </button>
      <span></span>
    </div>
    <div class="wood-dark flex flex-1 items-start justify-center overflow-y-auto px-5 py-8 pb-10">
      <div class="create-card flex w-full max-w-[460px] overflow-hidden rounded-[2px_10px_10px_2px]">
        <div class="create-spine w-[18px] shrink-0"></div>
        <div class="create-inner relative flex-1 px-7 py-7 pb-6">
          <div class="mb-5 font-serif text-[17px] font-extrabold text-[#3a2a18] [text-shadow:0_1px_0_rgba(255,240,200,.5)]">{{ t('reader_create_title') }}</div>
          <div class="mb-4">
            <div class="mb-1.5 text-[11px] font-semibold tracking-wider text-[#8a6840]">{{ t('reader_title_label') }}</div>
            <input :value="newTitle" @input="$emit('update:newTitle', $event.target.value)" class="w-full rounded border border-[rgba(160,120,60,.15)] bg-white/50 px-3.5 py-2.5 text-[13px] text-[#3a2a18] font-inherit outline-none placeholder:text-black/20 shadow-[inset_0_1px_3px_rgba(0,0,0,.04)] focus:border-[rgba(160,120,60,.4)] focus:shadow-[inset_0_1px_3px_rgba(0,0,0,.06),0_0_0_2px_rgba(160,120,60,.1)]" :placeholder="t('reader_title_placeholder')" />
          </div>
          <div class="mb-4">
            <div class="mb-1.5 text-[11px] font-semibold tracking-wider text-[#8a6840]">{{ t('reader_worldview_label') }}</div>
            <textarea :value="newPremise" @input="$emit('update:newPremise', $event.target.value)" class="w-full min-h-[80px] resize-y rounded border border-[rgba(160,120,60,.15)] bg-white/50 px-3.5 py-2.5 text-[13px] leading-relaxed text-[#3a2a18] font-inherit outline-none placeholder:text-black/20 shadow-[inset_0_1px_3px_rgba(0,0,0,.04)] focus:border-[rgba(160,120,60,.4)] focus:shadow-[inset_0_1px_3px_rgba(0,0,0,.06),0_0_0_2px_rgba(160,120,60,.1)]" :placeholder="t('reader_worldview_placeholder')"></textarea>
          </div>
          <button @click="$emit('create')" :disabled="creating" class="relative top-0 mt-1 w-full cursor-pointer rounded-md border border-black/20 bg-[linear-gradient(180deg,#c09048,#9a6c28)] py-3 text-sm font-bold text-[#fff8ee] font-inherit [text-shadow:0_1px_2px_rgba(0,0,0,.3)] shadow-[0_3px_0_rgba(100,60,10,.4),inset_0_1px_0_rgba(255,240,200,.2)] transition-all hover:bg-[linear-gradient(180deg,#d0a058,#aa7c38)] active:top-[3px] active:shadow-[0_0_0_rgba(100,60,10,.4),inset_0_2px_4px_rgba(0,0,0,.2)] disabled:cursor-default disabled:opacity-40">
            {{ creating ? t('reader_creating') : t('reader_start_creating') }}
          </button>
        </div>
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import { useI18n } from '../../i18n/index.ts';

const { t } = useI18n();

defineProps({
  view: { type: String, required: true },
  newTitle: { type: String, required: true },
  newPremise: { type: String, required: true },
  creating: { type: Boolean, required: true }
});

defineEmits(['back', 'create', 'update:newTitle', 'update:newPremise']);
</script>
