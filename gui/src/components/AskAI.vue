<script setup>
import { useViewStore } from '@/stores/view.js';

const view = useViewStore();
</script>

<template>
  <button class="trigger-btn" :class="{ active: view.chatOpen }"
    @click="view.toggleChat()" title="问 AI">
    <span class="material-symbols-outlined trigger-icon">chat_bubble_outline</span>
  </button>
</template>

<style scoped>
.trigger-btn {
  width: 40px; height: 40px;
  display: grid; place-items: center;
  border: 0; background: transparent;
  color: inherit;
  border-radius: 8px;
  cursor: pointer;
  transition: background .12s;
}
.trigger-btn:hover { background: rgba(128,128,128,.12); }
.trigger-btn.active { background: rgba(128,128,128,.18); }
.trigger-icon { font-size: 22px; }
</style>
