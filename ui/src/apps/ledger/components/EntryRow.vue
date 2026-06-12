<template>
  <div class="ent" @click="$emit('open', entry)">
    <span class="ico">{{ category.emoji }}</span>
    <div><b>{{ entry.note || entry.category }}</b><small>{{ dayLabel(entry.occurredOn || entry.occurred_on) }}</small></div>
    <span class="amt" :class="{ in: entry.type === 'income' }">{{ entry.type === 'income' ? '+' : '-' }}{{ money(entry.amount) }}</span>
  </div>
</template>

<script setup>
import { dayLabel, money } from '../lib/format.js';

defineProps({
  entry: { type: Object, required: true },
  category: { type: Object, required: true },
});
defineEmits(['open']);
</script>

<style scoped>
.ent{display:flex;align-items:center;gap:12px;padding:11px 16px;background:var(--panel);border:1px solid var(--line);border-radius:12px;box-shadow:var(--shadow);margin-bottom:8px;cursor:pointer;transition:border-color .12s}
.ent:hover{border-color:var(--line2)}
.ent .ico{display:grid;place-items:center;width:34px;height:34px;border-radius:9px;background:var(--color-bg-hi);color:var(--ink2);font-size:13px;flex-shrink:0}
.ent b{font-size:13px;font-weight:600;display:block}
.ent small{font-size:11.5px;color:var(--muted)}
.amt{margin-left:auto;font-weight:650;font-variant-numeric:tabular-nums}
.amt.in{color:var(--green)}
</style>
