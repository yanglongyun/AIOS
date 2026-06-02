<script setup>
import { useViewStore } from '@/stores/view.js';

const view = useViewStore();
</script>

<template>
  <button class="apps-trigger trigger-btn" :class="{ active: view.appsOpen }"
    @click="view.toggleApps()" title="所有应用">
    <span class="material-symbols-outlined trigger-icon">apps</span>
  </button>
</template>

<style scoped>
.trigger-btn {
  width: 40px; height: 40px;
  display: none; place-items: center;
  border: 0; background: transparent;
  color: inherit;
  border-radius: 8px;
  cursor: pointer;
  transition: background .12s;
}
@media (max-width: 768px) {
  .trigger-btn {
    display: grid;
  }
}
.trigger-btn:hover { background: rgba(128,128,128,.12); }
.trigger-btn.active { background: rgba(128,128,128,.18); }
.trigger-icon { font-size: 22px; }
</style>
