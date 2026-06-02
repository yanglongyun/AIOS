<script setup>
import { marked } from 'marked';

marked.setOptions({ breaks: true, gfm: true });
const renderMd = (text) => marked.parse(text || '');

defineProps({
  text: { type: String, default: '' },
  remark: { type: String, default: null }
});
</script>

<template>
  <div class="chat-scroll-bubble max-w-[min(78%,720px)] rounded-lg rounded-tl-[2px] bg-bg-elev border border-line px-3.5 py-2.5 text-[14px] leading-[1.55] max-md:max-w-[92%]" style="width: fit-content;">
    <div class="md" v-html="renderMd(text)" />
    <div v-if="remark"
      class="mt-2.5 border-t border-dashed border-line pt-2 text-[12.5px] italic leading-[1.55] text-faint">
      {{ remark }}
    </div>
  </div>
</template>

<style scoped>
.chat-scroll-bubble {
  overflow-wrap: anywhere;
  word-break: break-word;
}
.md {
  max-width: 100%;
}
:deep(.md *) {
  overflow-wrap: anywhere;
}
:deep(.md p) { margin: 0 0 0.6em; }
:deep(.md p:last-child) { margin-bottom: 0; }
:deep(.md pre) {
  background: var(--bg-elev);
  border: 1px solid var(--line);
  color: var(--accent);
  padding: 10px 12px;
  border-radius: 4px;
  overflow-x: auto;
  overflow-wrap: normal;
  word-break: normal;
  font-size: 12.5px;
  line-height: 1.55;
  margin: 8px 0;
  font-family: var(--font-mono);
}
:deep(.md code) {
  background: rgba(255, 255, 255, 0.06);
  color: var(--accent);
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 13px;
  font-family: var(--font-mono);
}
:deep(.md pre code) { background: transparent; padding: 0; }
:deep(.md table) { display: block; max-width: 100%; overflow-x: auto; }
:deep(.md img) { max-width: 100%; height: auto; }
:deep(.md ul), :deep(.md ol) { margin: 0.4em 0; padding-left: 1.5em; }
:deep(.md a) { color: var(--accent); text-decoration: underline; }
</style>
