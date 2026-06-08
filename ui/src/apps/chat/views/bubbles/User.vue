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
          class="flex max-w-[220px] items-center gap-1.5 rounded-[10px] border border-[rgba(255,225,150,0.36)] bg-[linear-gradient(160deg,rgba(122,74,8,0.34)_0%,rgba(88,46,0,0.22)_100%)] px-2 py-1 text-[#fff4d4] shadow-[inset_0_1px_0_rgba(255,230,170,0.18),0_1px_4px_rgba(80,40,0,0.12)]"
        >
          <span class="file-dot"></span>
          <span class="min-w-0 flex-1 truncate text-[11px] font-semibold">{{ f.name }}</span>
          <span v-if="formatSize(f.size)" class="shrink-0 font-mono text-[9px] opacity-70">{{ formatSize(f.size) }}</span>
        </div>
      </div>
      <div
        v-if="displayContent"
        class="user-bubble relative max-w-[min(72vw,560px)] overflow-hidden whitespace-pre-wrap break-words rounded-2xl border border-[rgba(160,100,0,0.3)] bg-[linear-gradient(160deg,#d4981e_0%,#b87e12_100%)] px-3.5 py-[11px] text-[14.5px] leading-[1.55] text-[rgba(255,248,220,0.95)] shadow-[0_3px_12px_rgba(90,50,0,0.3),0_1px_3px_rgba(90,50,0,0.2),inset_0_1px_0_rgba(255,220,100,0.4),inset_0_-1px_0_rgba(0,0,0,0.15)] [overflow-wrap:anywhere] [text-shadow:0_1px_2px_rgba(0,0,0,0.2)]"
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
  border: 1px solid rgba(255,240,200,0.44);
  background: linear-gradient(180deg,rgba(255,246,218,0.92),rgba(225,183,85,0.72));
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.35), 0 1px 2px rgba(70,35,0,0.18);
}
</style>
