<script setup>
import { computed } from 'vue';
import { renderMd } from '../../lib/renderMd.js';

const props = defineProps({
  msg: { type: Object, required: true },
  label: { type: String, default: 'Input' }
});

const displayContent = computed(() => String(props.msg?.content || '').replace(/[\r\n]+$/g, ''));
const title = computed(() => {
  if (props.msg?.kind === 'compaction') {
    const start = props.msg?.meta?.startMessageId;
    const end = props.msg?.meta?.endMessageId;
    return start && end ? `历史压缩 #${start} - #${end}` : '历史压缩';
  }
  return props.label;
});
</script>

<template>
  <div class="my-4 animate-[rise_0.5s_cubic-bezier(0.2,0.7,0.3,1)_both]">
    <div class="mb-1.5 flex items-center gap-1.5 text-[11px] text-[var(--muted)]">{{ label }}</div>
    <div class="overflow-hidden rounded-xl border border-[var(--line2)] bg-white shadow-card">
      <div class="flex cursor-pointer select-none items-center gap-2 bg-[#f7f7f8] px-3 py-[9px]" @click="msg.expanded = !msg.expanded">
        <span class="shrink-0 text-[10px] text-[var(--muted)]">{{ msg.expanded ? '▼' : '▶' }}</span>
        <span class="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs font-semibold text-[var(--ink2)]">{{ title }}</span>
        <span v-if="msg.meta?.tokens" class="text-[11px] text-[var(--muted)]">{{ msg.meta.tokens }} tokens</span>
      </div>
      <div v-if="msg.expanded" class="ai-text px-3 py-3 text-[13px] leading-[1.65] text-[var(--ink)]" v-html="renderMd(displayContent)"></div>
    </div>
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
