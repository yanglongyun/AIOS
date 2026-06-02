<script setup>
defineProps({
  filters: { type: Array, required: true },
  current: { type: String, required: true },
  counts:  { type: Object, default: () => ({}) }
});
defineEmits(['pick']);
</script>

<template>
  <nav class="flex flex-col gap-0.5 py-2">
    <button v-for="f in filters" :key="f.id"
      class="flex items-center gap-3.5 h-10 pl-5 pr-3.5 mr-3 rounded-r-md text-[13.5px] font-medium text-ink cursor-pointer border-l-2 border-transparent transition-colors hover:bg-card-hi"
      :class="{ 'bg-card-hi border-accent !text-accent': f.id === current }"
      @click="$emit('pick', f.id)">
      <span class="msi sm" :class="f.id === current ? 'text-accent' : 'text-muted'">{{ f.icon }}</span>
      <span class="flex-1 min-w-0 truncate text-left">{{ f.name }}</span>
      <span v-if="counts[f.id]"
        class="px-2 py-px rounded text-[11px] tabular-nums font-mono"
        :class="f.id === current ? 'bg-accent/15 text-accent' : 'bg-bg-elev text-faint'">
        {{ counts[f.id] }}
      </span>
    </button>
  </nav>
</template>
