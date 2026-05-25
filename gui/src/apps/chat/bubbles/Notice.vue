<script setup>
defineProps({
  text: { type: String, default: '' }
});
</script>

<template>
  <div class="notice">
    <span class="msi sm">bolt</span>
    <div class="body">{{ text }}</div>
  </div>
</template>

<style scoped>
.notice {
  max-width: 720px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  border-radius: 14px;
  border: 1px solid var(--line);
  background: #fbfcfd;
  padding: 11px 13px;
  color: var(--text-2);
  font-size: 13px;
  line-height: 1.55;
}
.notice .msi {
  color: var(--accent);
  margin-top: 1px;
}
.body {
  min-width: 0;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
