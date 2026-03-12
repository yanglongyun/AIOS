<template>
  <div class="fixed inset-0 z-[85]" @click.self="$emit('close')">
    <div
      class="absolute bottom-0 right-0 top-12 flex w-[400px] flex-col overflow-hidden rounded-l-2xl shadow-[-4px_0_20px_rgba(0,0,0,0.3)] max-md:w-full max-md:rounded-none">

      <!-- 复用 Chat 组件 -->
      <Chat :context="context" class="min-h-0 flex-1" />
    </div>
  </div>
</template>

<script setup>
import Chat from './Chat.vue';

defineProps({
  context: { type: String, default: '' }
});
defineEmits(['close']);
</script>
