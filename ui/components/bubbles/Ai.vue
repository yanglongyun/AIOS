<script setup>
import { computed } from 'vue';
import { renderMd } from '../../lib/renderMd.js';

const props = defineProps({
  content: { type: String, default: '' }
});

const displayContent = computed(() => String(props.content || '').replace(/[\r\n]+$/g, ''));
</script>

<template>
  <div class="my-4 animate-[rise_0.5s_cubic-bezier(0.2,0.7,0.3,1)_both]">
    <div class="mb-1.5 flex items-center gap-1.5 text-[11px] text-[var(--muted)]">Agent</div>
    <div class="ai-text rounded-2xl border border-[var(--line)] bg-white px-5 py-4 text-[14px] leading-[1.7] text-[var(--ink)] shadow-card" v-html="renderMd(displayContent)"></div>
  </div>
</template>

<style scoped>
:deep(p) {
  margin: 0 0 10px;
  max-width: 100%;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
:deep(p:first-child) { margin-top: 0; }
:deep(p:last-child) { margin-bottom: 0; }
:deep(pre) { max-width: 100%; overflow-x: auto; white-space: pre; border-radius: 10px; padding: 10px; margin: 8px 0; background: #f7f7f8; border: 1px solid var(--line2); font-size: 12px; }
:deep(code) { max-width: 100%; overflow-wrap: anywhere; font-size: 12px; background: var(--accent-soft); padding: 1px 4px; border-radius: 4px; }
:deep(pre code) { background: none; padding: 0; overflow-wrap: normal; }
:deep(strong) { font-weight: 620; color: var(--ink); }
</style>
