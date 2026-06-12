<template>
  <form class="ai-bar" @submit.prevent="$emit('submit')">
    <input v-model="prompt" placeholder="__T_NOTEPAD_AI_PLACEHOLDER__" />
    <button type="submit" class="send" :disabled="loading || !prompt.trim()" title="__T_COMMON_SEND__">
      <ArrowUp :size="14" :stroke-width="2" />
    </button>
  </form>
</template>

<script setup>
import { ArrowUp } from 'lucide-vue-next';

defineProps({
  loading: { type: Boolean, default: false },
});
defineEmits(['submit']);
const prompt = defineModel('prompt', { type: String, default: '' });
</script>

<style scoped>
.ai-bar{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid var(--line2);border-radius:999px;padding:6px 6px 6px 16px;box-shadow:var(--shadow);margin-bottom:10px}
.ai-bar input{flex:1;border:0;outline:0;background:transparent;color:var(--color-ink);font:inherit;font-size:13.5px}
.ai-bar .send{display:grid;place-items:center;width:32px;height:32px;border-radius:50%;border:0;background:var(--accent);color:#fff;cursor:pointer;flex:none}
.ai-bar .send:hover{background:var(--color-accent-hi)}
.ai-bar .send:disabled{opacity:.45;cursor:default}
</style>
