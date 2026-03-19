<template>
  <template v-if="view === 'detail' && activeSession">
    <div class="beam shrink-0 relative z-20 flex h-[42px] items-center justify-between px-5">
      <button class="relative top-0 flex cursor-pointer items-center gap-1 rounded-md border border-black/20 bg-[linear-gradient(180deg,rgba(255,255,255,.12),rgba(0,0,0,.08))] px-3 py-1 pl-2 text-xs font-semibold text-[#fff8ee] [text-shadow:0_1px_2px_rgba(0,0,0,.4)] shadow-[0_2px_0_rgba(0,0,0,.25),inset_0_1px_0_rgba(255,240,200,.12)] transition-all hover:bg-[linear-gradient(180deg,rgba(255,255,255,.18),rgba(0,0,0,.04))] active:top-[2px] active:shadow-[0_0_0_rgba(0,0,0,.25),inset_0_1px_3px_rgba(0,0,0,.2)]" @click="$emit('back')">
        <svg class="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
        {{ t('reader_back') }}
      </button>
      <button @click="$emit('reset')" :disabled="loading" class="relative top-0 cursor-pointer rounded-md border border-black/20 bg-[linear-gradient(180deg,rgba(255,255,255,.12),rgba(0,0,0,.08))] px-2.5 py-1 text-[11px] font-semibold text-[#fff8ee] [text-shadow:0_1px_2px_rgba(0,0,0,.4)] shadow-[0_2px_0_rgba(0,0,0,.25),inset_0_1px_0_rgba(255,240,200,.12)] transition-all hover:bg-[linear-gradient(180deg,rgba(255,255,255,.18),rgba(0,0,0,.04))] active:top-[2px] active:shadow-[0_0_0_rgba(0,0,0,.25),inset_0_1px_3px_rgba(0,0,0,.2)] disabled:cursor-default disabled:opacity-40">{{ t('reader_reset') }}</button>
    </div>
    <div class="wood-dark flex-1 overflow-y-auto px-5 py-6 pb-10">
      <div ref="timelineEl" class="mx-auto max-w-[640px]">
        <div v-if="!chapters.length" class="rounded-xl border border-dashed border-black/10 py-12 text-center text-[13px] text-[#9a8060]">
          {{ t('reader_empty_chapter') }}
        </div>
        <div v-for="ch in chapters" :key="ch.id">
          <div v-if="ch.action && !isStartReaderAction(ch.action)" class="mb-2 flex items-center gap-2">
            <span class="h-px flex-1 bg-[linear-gradient(90deg,transparent,rgba(0,0,0,.08),transparent)]"></span>
            <span class="whitespace-nowrap rounded-full border border-black/[.06] bg-white/30 px-2.5 py-0.5 text-[10px] text-[#8a7050]">{{ ch.action }}</span>
            <span class="h-px flex-1 bg-[linear-gradient(90deg,transparent,rgba(0,0,0,.08),transparent)]"></span>
          </div>
          <div class="chapter-body mb-3 rounded-[10px] border border-black/[.04] bg-white/50 px-4 py-3.5 hover:bg-white/[.65]">
            <div class="mb-1.5 flex items-center justify-between">
              <span class="text-[10px] font-bold tracking-wider text-[#b08040]">{{ t('reader_chapter_index', { n: ch.idx }) }}</span>
              <span class="text-[10px] text-[#a09070]">{{ ch.progress }}</span>
            </div>
            <p class="whitespace-pre-wrap text-[13px] leading-[1.9] text-[#4a3a28]">{{ ch.content }}</p>
          </div>
        </div>

        <div v-if="loading" class="flex items-center gap-2.5 py-4 text-xs text-[#9a8060]">
          <div class="h-4 w-4 animate-spin rounded-full border-2 border-black/[.08] border-t-[#b08040]"></div>
          {{ t('reader_loading_hint') }}
        </div>

        <div v-if="!loading" class="action-panel mt-5 flex flex-col gap-3 rounded-xl px-4 py-4 pb-5">
          <div class="flex items-center gap-2 text-[10px] font-bold tracking-widest text-[#9a7848]">
            <span class="h-px flex-1 bg-[linear-gradient(90deg,transparent,rgba(160,120,60,.2),transparent)]"></span>
            {{ chapters.length ? t('reader_next_step') : t('reader_begin_journey') }}
            <span class="h-px flex-1 bg-[linear-gradient(90deg,transparent,rgba(160,120,60,.2),transparent)]"></span>
          </div>
          <div v-if="error" class="rounded-lg border border-[rgba(200,60,40,.12)] bg-[rgba(200,60,40,.08)] px-3 py-1.5 text-[11px] text-[#e07050]">{{ error }}</div>
          <div v-if="currentChoices.length" class="grid grid-cols-3 gap-2">
            <button
              v-for="(choice, i) in currentChoices"
              :key="`${i}-${choice}`"
              @click="$emit('generate', choice)"
              :disabled="loading"
              class="relative top-0 cursor-pointer rounded-lg border border-[rgba(120,80,30,.15)] bg-[linear-gradient(180deg,rgba(255,250,235,.7),rgba(240,225,195,.6))] px-2 py-2.5 text-left text-[11px] leading-snug text-[#4a3820] shadow-[0_2px_0_rgba(120,80,30,.1),inset_0_1px_0_rgba(255,255,255,.5)] transition-all hover:border-[rgba(120,80,30,.25)] hover:bg-[linear-gradient(180deg,rgba(255,252,240,.85),rgba(245,230,200,.75))] hover:shadow-[0_2px_0_rgba(120,80,30,.15),inset_0_1px_0_rgba(255,255,255,.6)] active:top-[2px] active:shadow-[0_0_0_rgba(120,80,30,.1),inset_0_1px_3px_rgba(0,0,0,.08)] disabled:cursor-default disabled:opacity-40"
            >{{ choice }}</button>
          </div>
          <div class="flex gap-2">
            <input
              :value="customAction"
              :placeholder="chapters.length ? t('reader_custom_action') : t('reader_opening_placeholder')"
              @input="$emit('update:customAction', $event.target.value)"
              @keyup.enter="chapters.length ? $emit('run-custom') : $emit('generate', startAction)"
              class="flex-1 rounded-lg border border-[rgba(120,80,30,.15)] bg-[rgba(255,252,240,.7)] px-3.5 py-2.5 text-[13px] text-[#3a2a18] font-inherit outline-none placeholder:text-black/20 shadow-[inset_0_1px_3px_rgba(0,0,0,.05)] transition-[border-color,box-shadow] focus:border-[rgba(160,120,60,.35)] focus:shadow-[inset_0_1px_3px_rgba(0,0,0,.06),0_0_0_2px_rgba(160,120,60,.08)]"
            />
            <button
              @click="chapters.length ? $emit('run-custom') : $emit('generate', startAction)"
              :disabled="loading"
              class="relative top-0 shrink-0 cursor-pointer rounded-lg border border-black/20 bg-[linear-gradient(180deg,#c09048,#9a6c28)] px-5 py-2.5 text-[13px] font-bold text-[#fff8ee] [text-shadow:0_1px_2px_rgba(0,0,0,.3)] shadow-[0_3px_0_rgba(100,60,10,.35),inset_0_1px_0_rgba(255,240,200,.2)] transition-all hover:bg-[linear-gradient(180deg,#d0a058,#aa7c38)] active:top-[3px] active:shadow-[0_0_0_rgba(100,60,10,.35),inset_0_2px_4px_rgba(0,0,0,.2)] disabled:cursor-default disabled:opacity-40 disabled:top-0"
            >{{ loading ? t('reader_generating') : (chapters.length ? t('reader_continue') : t('reader_start_reader')) }}</button>
          </div>
        </div>
      </div>
    </div>
  </template>
</template>

<script setup>
import { ref, watchEffect } from 'vue';
import { useI18n } from '../../i18n/index.js';

const { t } = useI18n();

const props = defineProps({
  view: { type: String, required: true },
  activeSession: { type: Object, default: null },
  chapters: { type: Array, required: true },
  error: { type: String, required: true },
  loading: { type: Boolean, required: true },
  currentChoices: { type: Array, required: true },
  customAction: { type: String, required: true },
  startAction: { type: String, required: true },
  isStartReaderAction: { type: Function, required: true }
});

defineEmits(['back', 'reset', 'generate', 'run-custom', 'update:customAction']);

const timelineEl = ref(null);

watchEffect(() => {
  if (props.view === 'detail' && timelineEl.value) {
    timelineEl.value.scrollTop = timelineEl.value.scrollHeight;
  }
});
</script>
