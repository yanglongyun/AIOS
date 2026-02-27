<template>
  <section class="space-y-2">
    <span class="text-xs text-neutral-500 dark:text-neutral-400 font-medium">外观</span>
    <div class="flex gap-2">
      <button
        @click="$emit('set-theme', 'dark')"
        class="flex-1 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors border"
        :class="theme === 'dark'
          ? 'bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900 border-transparent'
          : 'border-gray-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-800'"
      >深色</button>
      <button
        @click="$emit('set-theme', 'light')"
        class="flex-1 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors border"
        :class="theme === 'light'
          ? 'bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900 border-transparent'
          : 'border-gray-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-800'"
      >浅色</button>
    </div>
    <div class="pt-2 flex justify-end">
      <button @click="$emit('save')" class="px-4 py-2 bg-neutral-800 dark:bg-neutral-200 hover:opacity-80 rounded-lg text-sm text-white dark:text-neutral-900 cursor-pointer transition-opacity">保存</button>
    </div>
  </section>
</template>

<script setup>
defineProps({
  theme: { type: String, default: 'dark' }
});

defineEmits(['set-theme', 'save']);
</script>
