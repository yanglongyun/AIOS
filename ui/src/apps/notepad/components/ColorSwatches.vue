<template>
  <div class="swatches">
    <button
      v-for="c in PALETTE"
      :key="c"
      class="swatch"
      :class="{ on: (color || '#ffffff') === c }"
      :style="{ background: c, '--sw': accentOf(c) }"
      @click="$emit('pick', c)"
    ></button>
  </div>
</template>

<script setup>
import { PALETTE, accentOf } from '../lib/format.js';

defineProps({
  color: { type: String, default: '#ffffff' },
});
defineEmits(['pick']);
</script>

<style scoped>
.swatches{display:flex;gap:8px;margin-bottom:12px}
.swatch{width:18px;height:18px;border-radius:50%;border:1px solid rgba(0,0,0,.08);cursor:pointer;padding:0;transition:transform .12s}
.swatch:hover{transform:scale(1.18)}
.swatch.on{box-shadow:0 0 0 2px #fff,0 0 0 4px var(--sw)}
</style>
