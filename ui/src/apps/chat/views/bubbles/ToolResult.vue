<script setup>
import { computed } from 'vue';

const props = defineProps({
  content: { type: String, default: '' }
});

const displayContent = computed(() => String(props.content || '').replace(/[\r\n]+$/g, ''));
</script>

<template>
  <div class="mb-3 flex items-start">
    <pre class="tool-result m-0 max-w-[min(78vw,720px)] overflow-x-auto whitespace-pre rounded-xl bg-[#fffdf8] px-3 py-2.5 font-mono text-[11px] leading-[1.6] text-[#7a6a50] [scrollbar-width:none] [word-break:normal]">{{ displayContent }}</pre>
  </div>
</template>

<style scoped>
.tool-result::-webkit-scrollbar { display: none; }
</style>
