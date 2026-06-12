<template>
  <div class="field">
    <label>{{ label }}</label>
    <slot></slot>
    <small v-if="hint">{{ hint }}</small>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  hint: { type: String, default: '' },
});
</script>

<style scoped>
.field {
  margin-bottom: 14px;
}
.field:last-child {
  margin-bottom: 0;
}
.field label {
  display: block;
  font-size: 12.5px;
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--color-ink);
}
.field :deep(input) {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid #dededf;
  border-radius: 9px;
  font: inherit;
  font-size: 13.5px;
  outline: 0;
  background: var(--color-bg-elev);
  color: var(--color-ink);
  transition: border-color 0.12s, box-shadow 0.12s;
}
.field :deep(input:focus) {
  border-color: rgba(98, 165, 244, 0.45);
  box-shadow: 0 0 0 1px rgba(98, 165, 244, 0.45);
}
.field small {
  display: block;
  color: var(--color-faint);
  font-size: 11.5px;
  margin-top: 5px;
}
</style>
