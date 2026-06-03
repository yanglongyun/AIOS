<template>
  <nav class="memory-sidebar">
    <button
      v-for="item in filters"
      :key="item.id"
      class="memory-filter"
      :class="{ active: item.id === current }"
      @click="$emit('pick', item.id)">
      <span class="msi sm">{{ item.icon }}</span>
      <span class="label">{{ item.name }}</span>
      <span v-if="counts[item.id]" class="count">{{ counts[item.id] }}</span>
    </button>
  </nav>
</template>

<script setup>
defineProps({
  filters: { type: Array, required: true },
  current: { type: String, required: true },
  counts: { type: Object, default: () => ({}) },
});

defineEmits(['pick']);
</script>

<style scoped>
.memory-sidebar {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 0;
}
.memory-filter {
  display: flex;
  height: 40px;
  align-items: center;
  gap: 14px;
  border-radius: 0 20px 20px 0;
  color: var(--color-ink);
  font-size: 14px;
  font-weight: 500;
  margin-right: 12px;
  padding: 0 14px 0 24px;
  transition: background 0.15s ease, color 0.15s ease;
}
.memory-filter:hover {
  background: var(--bg-hover);
}
.memory-filter.active {
  background: var(--color-blue-bg);
  color: var(--color-blue-fg);
}
.memory-filter .msi {
  color: var(--color-muted);
}
.memory-filter.active .msi {
  color: var(--color-blue-fg);
}
.label {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.count {
  border-radius: 999px;
  background: var(--color-bg-elev);
  color: var(--color-faint);
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
  padding: 1px 8px;
}
.active .count {
  background: var(--accent-soft);
  color: var(--color-blue-fg);
}
</style>
