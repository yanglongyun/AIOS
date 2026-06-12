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
      <div class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] border border-line bg-bg-hi text-[13px] font-bold text-[var(--color-good)]">
        订
      </div>
      <div class="min-w-0 overflow-hidden rounded-xl border border-line bg-bg-elev px-3.5 py-[11px] text-[14px] leading-[1.55] text-ink shadow-[var(--shadow-sm)]">
        <div class="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-muted">
          <span class="h-1.5 w-1.5 rounded-full bg-[var(--color-good)]"></span>
          订阅结果
        </div>
        <div class="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{{ displayContent }}</div>
      </div>
    </div>
  </div>
</template>
