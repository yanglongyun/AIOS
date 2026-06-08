<script setup>
import { computed } from 'vue';
import { renderMd } from '@/utils/renderMd.js';

const props = defineProps({
  content: { type: String, default: '' }
});

const displayContent = computed(() => String(props.content || '').replace(/[\r\n]+$/g, ''));
</script>

<template>
  <div class="mb-4 flex items-end">
    <div class="min-w-0 max-w-full">
      <div
        class="ai-bubble relative max-w-[min(78vw,720px)] overflow-hidden whitespace-pre-wrap break-words rounded-2xl border border-[rgba(180,150,80,0.2)] bg-[linear-gradient(160deg,#faf5e8_0%,#f2ebd8_100%)] px-3.5 py-[11px] text-[14.5px] leading-[1.55] text-[#3a2415] shadow-[0_3px_12px_rgba(90,60,20,0.15),0_1px_3px_rgba(90,60,20,0.1),inset_0_1px_0_rgba(255,255,255,0.8)] [overflow-wrap:anywhere]"
        v-html="renderMd(displayContent)"
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
:deep(pre) { max-width: 100%; overflow-x: auto; white-space: pre; border-radius: 6px; padding: 8px; margin: 4px 0; background: rgba(0,0,0,0.05); font-size: 11px; }
:deep(code) { max-width: 100%; overflow-wrap: anywhere; font-size: 11px; background: rgba(120,90,40,0.08); padding: 1px 4px; border-radius: 3px; }
:deep(pre code) { background: none; padding: 0; overflow-wrap: normal; }
:deep(strong) { font-weight: 600; color: #2a1a10; }
</style>
