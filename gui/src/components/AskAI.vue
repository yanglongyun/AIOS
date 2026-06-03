<script setup>
import { useViewStore } from '@/stores/view.js';

const view = useViewStore();
</script>

<template>
  <button class="icon-btn" :class="{ active: view.chatOpen }"
    @click="view.toggleChat()" title="问 AI">
    <span class="msi sm">chat_bubble</span>
  </button>
</template>
