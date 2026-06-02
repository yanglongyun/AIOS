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
  border: 1px solid #e4e8ed;
  border-radius: 18px;
  background: #fff;
  color: #68737d;
  padding: 38px 20px;
  text-align: center;
  box-shadow:
    0 1px 2px rgba(60, 64, 67, 0.06),
    0 4px 12px rgba(60, 64, 67, 0.04);
}
.memory-empty > .msi {
  color: #8aa0b8;
  font-size: 38px;
}
h2 {
  margin: 0;
  color: #202124;
  font-size: 18px;
  font-weight: 650;
}
p {
  margin: 0 0 8px;
  color: #68737d;
  font-size: 13px;
}
.primary-btn {
  display: inline-flex;
  min-height: 38px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border-radius: 999px;
  background: #1a73e8;
  color: #fff;
  font-size: 13px;
  font-weight: 650;
  padding: 0 16px;
}
</style>
