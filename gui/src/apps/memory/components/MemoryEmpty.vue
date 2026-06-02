<template>
  <div class="memory-empty">
    <span class="msi">{{ icon }}</span>
    <h2 v-if="title">{{ title }}</h2>
    <p v-if="message">{{ message }}</p>
    <button v-if="actionLabel" class="primary-btn" @click="$emit('action')">
      <span class="msi xxs">add</span>
      {{ actionLabel }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  icon: { type: String, required: true },
  title: { type: String, default: '' },
  message: { type: String, default: '' },
  actionLabel: { type: String, default: '' },
});

defineEmits(['action']);
</script>

<style scoped>
.memory-empty {
  display: grid;
  min-height: 260px;
  place-items: center;
  gap: 8px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--bg-card);
  color: var(--text-2);
  padding: 38px 20px;
  text-align: center;
  box-shadow:
    var(--shadow-1);
}
.memory-empty > .msi {
  color: var(--text-3);
  font-size: 38px;
}
h2 {
  margin: 0;
  color: var(--text);
  font-size: 18px;
  font-weight: 650;
}
p {
  margin: 0 0 8px;
  color: var(--text-2);
  font-size: 13px;
}
.primary-btn {
  display: inline-flex;
  min-height: 38px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border-radius: 8px;
  background: var(--accent);
  color: var(--bg);
  font-size: 13px;
  font-weight: 650;
  padding: 0 16px;
}
</style>
