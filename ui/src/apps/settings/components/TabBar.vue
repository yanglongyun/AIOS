<template>
  <div class="tabs">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      class="tab"
      :class="{ on: active === tab.id }"
      @click="active = tab.id"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  tabs: { type: Array, default: () => [] },
});
const active = defineModel('active', { type: String, default: '' });
</script>

<style scoped>
.tabs {
  display: flex;
  gap: 4px;
  background: #f0f0f1;
  border-radius: 10px;
  padding: 4px;
  margin-bottom: 16px;
  width: fit-content;
}
.tab {
  padding: 7px 18px;
  border: none;
  border-radius: 8px;
  background: transparent;
  font: inherit;
  font-size: 13px;
  color: var(--color-muted);
  cursor: pointer;
}
.tab.on {
  background: #fff;
  color: var(--color-ink);
  box-shadow: 0 1px 3px rgba(20, 20, 25, 0.08);
  font-weight: 600;
}
</style>
