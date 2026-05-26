<script setup>
defineProps({
  items: { type: Array, required: true },
  current: { type: String, required: true },
});

defineEmits(["pick"]);
</script>

<template>
  <nav class="flex flex-col gap-0.5 py-2">
    <button
      v-for="item in items"
      :key="item.id"
      class="flex h-10 items-center gap-3.5 rounded-r-[20px] pl-6 pr-3.5 mr-3 text-[14px] font-medium text-ink cursor-pointer transition-colors hover:bg-bg-hi"
      :class="{ '!bg-blue-bg !text-blue-fg': item.id === current }"
      @click="$emit('pick', item.id)">
      <span class="msi sm" :class="item.id === current ? 'text-blue-fg' : 'text-muted'">{{ item.icon }}</span>
      <span class="min-w-0 flex-1 truncate text-left">{{ item.name }}</span>
    </button>
  </nav>
</template>
