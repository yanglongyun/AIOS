<template>
  <div class="cc-chart-card">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="text-[13px] font-bold">{{ plan.title }}</div>
        <div class="cc-mono text-[10.5px] mt-1" style="color:#8a7965">{{ plan.slug }}.md · {{ formatDate(plan.modified) }} · {{ Math.round(plan.sizeBytes / 1024) }}__T_CLAUDE_PLAN_KB__</div>
      </div>
      <button class="shrink-0 text-[11px] px-2.5 py-1 rounded-md border bg-white hover:bg-[#fdf7e8]"
        style="border-color:rgba(140,100,60,0.18);color:#4a3826"
        :disabled="loading" @click="toggle">
        {{ loading ? '__T_CLAUDE_LOADING__' : (expanded ? '__T_CLAUDE_PLAN_COLLAPSE__' : '__T_CLAUDE_PLAN_EXPAND__') }}
      </button>
    </div>

    <pre v-if="!expanded && plan.preview"
      class="mt-2 text-[11.5px] whitespace-pre-wrap"
      style="color:#6b5a46;font-family:inherit;max-height:80px;overflow:hidden">{{ plan.preview }}</pre>

    <div v-if="expanded" class="mt-3">
      <div v-if="error" class="text-[11.5px] mb-2" style="color:#b03a20">{{ error }}</div>
      <pre v-if="full" class="cc-mono text-[11.5px] p-3 rounded-md overflow-x-auto whitespace-pre-wrap"
        style="background:#faf7f0;color:#2a1f13;max-height:500px;overflow-y:auto">{{ full }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { formatDate } from '../utils.js';

const props = defineProps({
  plan: { type: Object, required: true }
});

const expanded = ref(false);
const full = ref('');
const loading = ref(false);
const error = ref('');

const toggle = async () => {
  if (expanded.value) {
    expanded.value = false;
    return;
  }
  if (full.value) {
    expanded.value = true;
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    const r = await fetch(`/apps/claude-code/plans/file?slug=${encodeURIComponent(props.plan.slug)}`);
    const data = await r.json();
    if (!data.ok) {
      error.value = data.error || '__T_CLAUDE_LOAD_FAILED__';
      expanded.value = true;
      return;
    }
    full.value = data.content || '';
    expanded.value = true;
  } catch (err) {
    error.value = err?.message || String(err);
    expanded.value = true;
  } finally {
    loading.value = false;
  }
};
</script>
