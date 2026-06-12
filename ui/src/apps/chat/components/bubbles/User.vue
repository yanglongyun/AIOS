<script setup>
import { computed } from 'vue';

const props = defineProps({
  content: { type: String, default: '' },
  attachments: { type: Array, default: () => [] }
});

const displayContent = computed(() => String(props.content || '').replace(/[\r\n]+$/g, ''));

const formatSize = (size) => {
  const n = Number(size || 0);
  if (!n) return '';
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)}KB`;
  return `${(n / 1024 / 1024).toFixed(1)}MB`;
};
</script>

<template>
  <div class="mb-4 flex flex-row-reverse items-end">
    <div class="min-w-0 max-w-full">
      <div v-if="attachments?.length" class="mb-1.5 flex max-w-[min(76vw,560px)] flex-wrap justify-end gap-1.5">
        <div
          v-for="(f, fi) in attachments"
          :key="fi"
          class="flex max-w-[220px] items-center gap-1.5 rounded-[10px] border border-line bg-bg-elev px-2 py-1 text-ink shadow-[var(--shadow-sm)]"
        >
          <span class="file-dot"></span>
          <span class="min-w-0 flex-1 truncate text-[11px] font-semibold">{{ f.name }}</span>
          <span v-if="formatSize(f.size)" class="shrink-0 font-mono text-[9px] opacity-70">{{ formatSize(f.size) }}</span>
        </div>
      </div>
      <div
        v-if="displayContent"
        class="user-bubble relative max-w-[min(72vw,560px)] overflow-hidden whitespace-pre-wrap break-words rounded-[14px] border border-[var(--color-blue-soft)] bg-[var(--color-blue-bg)] px-3.5 py-[10px] text-[14px] leading-[1.55] text-ink [overflow-wrap:anywhere]"
      >{{ displayContent }}</div>
    </div>
  </div>
</template>

<style scoped>
.user-bubble::-webkit-scrollbar { display: none; }
.file-dot {
  width: 13px;
  height: 15px;
  border-radius: 2px;
  border: 1px solid var(--color-line-hi);
  background: var(--color-bg-hi);
}
</style>
