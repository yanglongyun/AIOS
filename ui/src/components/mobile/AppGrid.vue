<template>
  <div class="h-full overflow-y-auto px-4 py-4">
    <input
      v-model="search"
      class="mb-4 w-full rounded-[12px] border border-[rgba(200,160,96,0.3)] bg-white px-4 py-2.5 text-[14px] text-[#3a2a18] shadow-sm outline-none placeholder-[#b0a090] focus:border-[#c8a060]"
      placeholder="__T_LAUNCHER_SEARCH__"
    />
    <div class="grid grid-cols-4 gap-3">
      <button
        v-for="app in filtered"
        :key="app.id"
        class="flex flex-col items-center gap-1.5 rounded-[14px] px-1 py-3 transition-colors active:bg-[rgba(200,160,96,0.12)]"
        @click="$emit('open', app.id)"
      >
        <div class="flex h-[56px] w-[56px] items-center justify-center rounded-[16px] bg-white text-[28px] shadow-[0_2px_8px_rgba(90,62,40,0.1)]">{{ app.icon }}</div>
        <span class="text-center text-[11px] leading-tight text-[#5a4a38]">{{ app.name }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { appRegistry } from '../../apps.ts';
defineEmits(['open']);

const search = ref('');
const visible = appRegistry.filter(a => !a.hidden);
const filtered = computed(() => {
  if (!search.value.trim()) return visible;
  const q = search.value.toLowerCase();
  return visible.filter(a => a.name.toLowerCase().includes(q));
});
</script>
