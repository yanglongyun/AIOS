<template>
  <div class="h-full overflow-y-auto px-4 py-4">
    <div class="grid grid-cols-4 gap-3">
      <button
        v-for="app in visible"
        :key="app.id"
        class="flex flex-col items-center gap-1.5 rounded-[10px] px-1 py-3 transition-all duration-150 active:scale-95 active:bg-[rgba(224,136,80,0.12)]"
        @click="$emit('open', app.id)"
      >
        <span class="text-[30px] leading-none">{{ app.icon }}</span>
        <span class="max-w-[80px] text-center text-[11px] font-medium leading-tight text-[#2c2420] [text-shadow:0_1px_3px_rgba(255,255,255,0.8)]">{{ app.name }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { appRegistry } from '../../apps.js';
defineEmits(['open']);

const visible = appRegistry.filter(a => !a.hidden);
</script>
