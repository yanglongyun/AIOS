<template>
  <div class="rounded-lg border border-gray-200 dark:border-neutral-700 p-3">
    <textarea
      :value="note.content"
      @change="$emit('update', note.id, $event.target.value)"
      rows="4"
      class="w-full bg-transparent text-sm text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-500 outline-none resize-y"
      placeholder="输入内容..."
    />
    <div class="mt-2 flex items-center justify-between">
      <span class="text-[11px] text-neutral-400">#{{ note.id }} · {{ note.updated_at || note.created_at }}</span>
      <button
        @click="$emit('remove', note.id)"
        class="px-2 py-1 text-xs rounded text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 cursor-pointer transition-colors"
      >
        删除
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  note: { type: Object, required: true }
});

defineEmits(['update', 'remove']);
</script>
