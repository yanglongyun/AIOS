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
  border-radius: 0 6px 6px 0;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  margin-right: 12px;
  padding: 0 14px 0 24px;
  transition: background 0.15s ease, color 0.15s ease;
}
.memory-filter:hover {
  background: var(--bg-hover);
}
.memory-filter.active {
  background: var(--accent-soft);
  color: var(--accent);
  border: 1px solid rgba(0, 229, 255, .22);
  border-left: 0;
}
.memory-filter .msi {
  color: var(--text-2);
}
.memory-filter.active .msi {
  color: var(--accent);
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
  border-radius: 4px;
  background: var(--bg-elev);
  color: var(--text-3);
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
  padding: 1px 8px;
}
.active .count {
  background: rgba(0, 229, 255, .12);
  color: var(--accent);
}
</style>
