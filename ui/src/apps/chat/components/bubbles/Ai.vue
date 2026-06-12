<script setup>
import { computed } from 'vue';
import { renderMd } from '@/utils/renderMd.js';

const props = defineProps({
  content: { type: String, default: '' }
});

const displayContent = computed(() => String(props.content || '').replace(/[\r\n]+$/g, ''));
const htmlContent = computed(() => renderMd(displayContent.value).trim());
</script>

<template>
  <div class="mb-4 flex items-end">
    <div class="min-w-0 max-w-full">
      <div
        class="ai-bubble relative max-w-[min(78vw,720px)] overflow-hidden break-words rounded-xl border border-line bg-bg-elev px-3.5 py-[11px] text-[14.5px] leading-[1.55] text-ink shadow-[var(--shadow-sm)] [overflow-wrap:anywhere]"
        v-html="htmlContent"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.ai-bubble::-webkit-scrollbar { display: none; }
:deep(p) {
  margin: 0.25em 0;
  max-width: 100%;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
:deep(.ai-bubble p) {
  width: auto;
}
:deep(p:first-child) { margin-top: 0; }
:deep(p:last-child) { margin-bottom: 0; }
:deep(pre) { max-width: 100%; overflow-x: auto; white-space: pre; border-radius: 6px; padding: 8px; margin: 4px 0; background: var(--color-bg-hi); font-size: 11px; }
:deep(code) { max-width: 100%; overflow-wrap: anywhere; font-size: 11px; background: var(--color-bg-hi); padding: 1px 4px; border-radius: 3px; }
:deep(pre code) { background: none; padding: 0; overflow-wrap: normal; }
:deep(strong) { font-weight: 600; color: var(--color-ink); }
</style>
