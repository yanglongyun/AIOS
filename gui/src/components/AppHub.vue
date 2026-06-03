<script setup>
import { useViewStore } from '@/stores/view.js';

const view = useViewStore();
</script>

<template>
  <button class="apps-trigger trigger-btn" :class="{ active: view.globalNavOpen }"
    @click="view.toggleGlobalNav()" title="应用导航">
    <span class="material-symbols-outlined trigger-icon">apps</span>
  </button>
</template>

<style scoped>
.trigger-btn {
  width: 40px; height: 40px;
  display: grid; place-items: center;
  border: 0; background: transparent;
  color: inherit;
  border-radius: 50%;
  cursor: pointer;
  transition: background .12s;
}
.trigger-btn:hover { background: rgba(128,128,128,.12); }
.trigger-btn.active { background: rgba(128,128,128,.18); }
.trigger-icon { font-size: 22px; }
</style>
