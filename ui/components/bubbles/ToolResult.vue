<script setup>
import { computed } from 'vue';

const props = defineProps({
  content: { type: String, default: '' }
});

const displayContent = computed(() => String(props.content || '').replace(/[\r\n]+$/g, ''));
</script>

<template>
  <div class="my-4 animate-[rise_0.5s_cubic-bezier(0.2,0.7,0.3,1)_both]">
    <div class="mb-1.5 flex items-center gap-1.5 text-[11px] text-[var(--muted)]">Tool result</div>
    <pre class="overflow-x-auto whitespace-pre rounded-xl border border-[var(--line2)] bg-white px-3 py-2.5 font-mono text-[11px] leading-[1.6] text-[var(--ink2)] shadow-card">{{ displayContent }}</pre>
  </div>
</template>
