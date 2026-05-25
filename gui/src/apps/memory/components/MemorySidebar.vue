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
  color: var(--color-ink, #202124);
  font-size: 14px;
  font-weight: 500;
  margin-right: 12px;
  padding: 0 14px 0 24px;
  transition: background 0.15s ease, color 0.15s ease;
}
.memory-filter:hover {
  background: var(--color-bg-hi, #f1f4f8);
}
.memory-filter.active {
  background: var(--color-blue-bg, #e8f0fe);
  color: var(--color-blue-fg, #174ea6);
}
.memory-filter .msi {
  color: var(--color-muted, #69737d);
}
.memory-filter.active .msi {
  color: var(--color-blue-fg, #174ea6);
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
  background: var(--color-bg-elev, #fff);
  color: var(--color-faint, #8a9099);
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
  padding: 1px 8px;
}
.active .count {
  background: rgba(255, 255, 255, 0.55);
  color: var(--color-blue-fg, #174ea6);
}
</style>
