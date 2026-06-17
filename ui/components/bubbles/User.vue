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
  <div class="my-4 flex animate-[rise_0.5s_cubic-bezier(0.2,0.7,0.3,1)_both] flex-col items-end">
    <div class="mb-1.5 mr-1 flex items-center gap-1.5 text-[11px] text-[var(--muted)]">You</div>
    <div class="max-w-[80%] rounded-2xl border border-[#dbe8fc] bg-[#eef4fe] px-3.5 py-2.5 text-[14px] leading-[1.7] text-[var(--ink)]">
      <div v-if="attachments?.length" class="mb-2.5 flex flex-wrap gap-[7px]">
        <div
          v-for="(f, fi) in attachments"
          :key="fi"
          class="flex max-w-[220px] items-center gap-[7px] rounded-[10px] border border-[#dbe8fc] bg-white px-2 py-[5px] text-[var(--ink2)]"
        >
          <span class="h-[15px] w-[13px] rounded-sm border border-[#dbe8fc] bg-[#eef4fe]"></span>
          <span class="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[11px] font-semibold">{{ f.name }}</span>
          <span v-if="formatSize(f.size)" class="shrink-0 font-mono text-[9px] text-[var(--muted)]">{{ formatSize(f.size) }}</span>
        </div>
      </div>
      <p v-if="displayContent">{{ displayContent }}</p>
    </div>
  </div>
</template>
