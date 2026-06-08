<script setup>
import { computed } from 'vue';

const props = defineProps({
  content: { type: String, default: '' }
});

const displayContent = computed(() => String(props.content || '').replace(/[\r\n]+$/g, ''));
</script>

<template>
  <div class="mb-4 flex items-start">
    <div class="flex max-w-[min(78vw,720px)] gap-2.5">
      <div class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] border border-[rgba(70,120,110,0.18)] bg-[linear-gradient(160deg,#e8f4ef_0%,#d9ebe4_100%)] text-[13px] font-bold text-[#357060] shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_1px_4px_rgba(60,90,80,0.12)]">
        订
      </div>
      <div class="min-w-0 overflow-hidden rounded-2xl border border-[rgba(70,120,110,0.2)] bg-[linear-gradient(160deg,#f4fbf8_0%,#e7f3ee_100%)] px-3.5 py-[11px] text-[14px] leading-[1.55] text-[#26483f] shadow-[0_3px_12px_rgba(50,90,80,0.12),inset_0_1px_0_rgba(255,255,255,0.85)]">
        <div class="mb-1 flex items-center gap-1.5 font-sans text-[11px] font-semibold text-[#4f7c70]">
          <span class="h-1.5 w-1.5 rounded-full bg-[#4aa084] shadow-[0_0_0_3px_rgba(74,160,132,0.12)]"></span>
          订阅结果
        </div>
        <div class="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{{ displayContent }}</div>
      </div>
    </div>
  </div>
</template>
