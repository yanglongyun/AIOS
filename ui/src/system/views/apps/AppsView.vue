<template>
  <div class="h-full overflow-y-auto px-3.5 py-3.5" :style="bgStyle">
    <!-- Search -->
    <div class="relative mb-4">
      <Search :size="18" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9a7850]" />
      <input
        v-model="search"
        type="text"
        class="text-input w-full !pl-10"
        placeholder="搜索应用..."
      />
    </div>

    <!-- Grid -->
    <div class="grid grid-cols-4 gap-3">
      <button
        v-for="app in filtered"
        :key="app.id"
        type="button"
        class="flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border-0 bg-transparent px-1 py-2 transition-opacity active:opacity-70"
        @click="$emit('open', app.id)"
      >
        <div class="relative grid h-[58px] w-[58px] place-items-center overflow-hidden rounded-[16px]"
             :style="iconWrapStyle(app.id)">
          <span class="text-[27px] leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]">
            {{ app.icon }}
          </span>
          <!-- Glossy highlight overlay -->
          <div class="pointer-events-none absolute inset-0 rounded-[16px]" :style="glossStyle"></div>
        </div>
        <span class="max-w-16 truncate text-center font-sans text-[10.5px] leading-tight text-[#5a4030]">
          {{ app.name }}
        </span>
      </button>
    </div>

    <div v-if="!filtered.length" class="mt-12 flex flex-col items-center gap-2 text-[#9a8060]">
      <SearchX :size="38" :stroke-width="1.5" />
      <span class="text-[13px]">没有匹配的应用</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Search, SearchX } from 'lucide-vue-next';
import { apps as appRegistry } from '../../../apps.js';

defineEmits(['open']);

// chat / tasks 在 TabBar,grid 不显示
const HIDDEN_IN_GRID = new Set(['chat', 'tasks']);
const visible = appRegistry.filter(a => !HIDDEN_IN_GRID.has(a.id));

const search = ref('');
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return visible;
  return visible.filter(a => a.name.toLowerCase().includes(q));
});

// Parchment background with subtle noise (老版本同款)
const bgStyle = {
  background:
    'url("data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'>' +
      '<filter id=\'n\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'0.75\' numOctaves=\'4\' stitchTiles=\'stitch\'/>' +
      '<feColorMatrix type=\'saturate\' values=\'0\'/></filter>' +
      '<rect width=\'200\' height=\'200\' filter=\'url(%23n)\' opacity=\'0.04\'/></svg>"), ' +
    'linear-gradient(180deg, var(--color-bg) 0%, var(--color-bg-hi) 100%)',
};

// App icon gradients tuned to match the warm tactile visual style.
const iconGradients = {
  notepad: 'linear-gradient(145deg, #e0b35c, #a87312)',
  todo:    'linear-gradient(145deg, #7fcf95, #26704a)',
  ledger:  'linear-gradient(145deg, #4a8a5a, #1c4624)',
  settings:'linear-gradient(145deg, #9aa5b1, #45515f)',
};

const iconWrapStyle = (id) => ({
  background: iconGradients[id] || 'linear-gradient(145deg, #d4981e, #a07010)',
  boxShadow:
    '0 4px 12px rgba(90,60,20,0.22), ' +
    '0 2px 4px rgba(90,60,20,0.14), ' +
    'inset 0 1px 0 rgba(255,255,255,0.85), ' +
    'inset 0 -2px 0 rgba(0,0,0,0.08)',
  border: '1px solid rgba(160,130,70,0.20)',
});

const glossStyle = {
  background: 'linear-gradient(160deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 55%)',
};
</script>
